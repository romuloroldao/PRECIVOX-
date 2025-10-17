// Rotas de IA do PRECIVOX
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Middleware de autenticação (importar do auth existente)
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  // TODO: Validar JWT (usar middleware existente)
  req.user = { id: 'user-id', role: 'GESTOR' }; // Placeholder
  next();
};

// ============================================
// DASHBOARD PRINCIPAL DE IA
// ============================================

router.get('/dashboard/:mercadoId', authenticate, async (req, res) => {
  try {
    const { mercadoId } = req.params;
    
    // 1. Buscar alertas críticos (não lidos, prioridade ALTA ou CRITICA)
    const alertasCriticos = await prisma.alertaIA.findMany({
      where: {
        mercadoId,
        lido: false,
        prioridade: { in: ['ALTA', 'CRITICA'] },
        OR: [
          { expiradoEm: null },
          { expiradoEm: { gt: new Date() } }
        ]
      },
      orderBy: [
        { prioridade: 'desc' },
        { criadoEm: 'desc' }
      ],
      take: 5,
      include: {
        produto: { select: { nome: true } },
        unidade: { select: { nome: true } }
      }
    });

    // 2. Buscar métricas do dia atual
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let metricas = await prisma.metricasDashboard.findFirst({
      where: {
        mercadoId,
        data: hoje,
        periodo: 'DIA'
      }
    });

    // Se não existir, criar métricas iniciais
    if (!metricas) {
      metricas = await prisma.metricasDashboard.create({
        data: {
          mercadoId,
          data: hoje,
          periodo: 'DIA',
          giroEstoqueGeral: 4.2,
          taxaRuptura: 2.3,
          ticketMedio: 87.30,
          margemLiquida: 18.5,
        }
      });
    }

    // 3. Contar análises pendentes por módulo
    const analisesPendentes = await prisma.analiseIA.groupBy({
      by: ['tipo'],
      where: {
        mercadoId,
        status: 'PENDENTE',
        OR: [
          { expiraEm: null },
          { expiraEm: { gt: new Date() } }
        ]
      },
      _count: { id: true }
    });

    // 4. Buscar unidades do mercado
    const unidades = await prisma.unidade.findMany({
      where: { mercadoId },
      select: {
        id: true,
        nome: true,
        _count: { select: { estoques: true } }
      }
    });

    // 5. Calcular variações (comparar com ontem)
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    
    const metricasOntem = await prisma.metricasDashboard.findFirst({
      where: {
        mercadoId,
        data: ontem,
        periodo: 'DIA'
      }
    });

    const variacoes = metricasOntem ? {
      giroEstoque: ((metricas.giroEstoqueGeral - metricasOntem.giroEstoqueGeral) / metricasOntem.giroEstoqueGeral * 100),
      taxaRuptura: ((metricas.taxaRuptura - metricasOntem.taxaRuptura) / metricasOntem.taxaRuptura * 100),
      ticketMedio: ((Number(metricas.ticketMedio) - Number(metricasOntem.ticketMedio)) / Number(metricasOntem.ticketMedio) * 100),
      margemLiquida: ((metricas.margemLiquida - metricasOntem.margemLiquida) / metricasOntem.margemLiquida * 100)
    } : {
      giroEstoque: 0,
      taxaRuptura: 0,
      ticketMedio: 0,
      margemLiquida: 0
    };

    // 6. Resposta
    res.json({
      success: true,
      data: {
        alertasCriticos: alertasCriticos.map(a => ({
          id: a.id,
          tipo: a.tipo,
          titulo: a.titulo,
          descricao: a.descricao,
          prioridade: a.prioridade,
          acaoRecomendada: a.acaoRecomendada,
          linkAcao: a.linkAcao,
          produto: a.produto?.nome,
          unidade: a.unidade?.nome,
          criadoEm: a.criadoEm
        })),
        
        visaoExecutiva: {
          giroEstoque: {
            valor: metricas.giroEstoqueGeral,
            variacao: variacoes.giroEstoque,
            tendencia: variacoes.giroEstoque > 0 ? 'up' : 'down'
          },
          taxaRuptura: {
            valor: metricas.taxaRuptura,
            variacao: variacoes.taxaRuptura,
            tendencia: variacoes.taxaRuptura < 0 ? 'up' : 'down' // Negativo é bom
          },
          ticketMedio: {
            valor: metricas.ticketMedio,
            variacao: variacoes.ticketMedio,
            tendencia: variacoes.ticketMedio > 0 ? 'up' : 'down'
          },
          margemLiquida: {
            valor: metricas.margemLiquida,
            variacao: variacoes.margemLiquida,
            tendencia: variacoes.margemLiquida > 0 ? 'up' : 'down'
          }
        },
        
        modulosIA: {
          compras: {
            insightsPendentes: analisesPendentes.find(a => a.tipo === 'DEMANDA')?._count.id || 0
          },
          promocoes: {
            oportunidades: analisesPendentes.find(a => a.tipo === 'PROMOCAO')?._count.id || 0
          },
          conversao: {
            acoesSugeridas: analisesPendentes.find(a => a.tipo === 'PERFORMANCE')?._count.id || 0
          }
        },
        
        unidades,
        
        ultimaAtualizacao: new Date()
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dashboard IA:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar dashboard de IA' 
    });
  }
});

// ============================================
// MÓDULO DE COMPRAS E REPOSIÇÃO
// ============================================

router.get('/compras/:mercadoId', authenticate, async (req, res) => {
  try {
    const { mercadoId } = req.params;
    const { unidadeId, categoria } = req.query;

    // Buscar produtos com risco de ruptura
    const estoques = await prisma.estoque.findMany({
      where: {
        unidade: { mercadoId },
        ...(unidadeId && { unidadeId }),
        ...(categoria && { produto: { categoria } })
      },
      include: {
        produto: true,
        unidade: { select: { nome: true } }
      }
    });

    // Identificar produtos em risco de ruptura
    const produtosEmRuptura = estoques
      .filter(e => {
        const demandaDiaria = (e.produto.demandaPrevista7d || 1) / 7;
        const diasRestantes = e.quantidade / demandaDiaria;
        return diasRestantes < 3;
      })
      .map(e => ({
        id: e.produto.id,
        nome: e.produto.nome,
        unidade: e.unidade.nome,
        estoqueAtual: e.quantidade,
        demandaDiaria: (e.produto.demandaPrevista7d || 0) / 7,
        diasRestantes: e.quantidade / ((e.produto.demandaPrevista7d || 1) / 7),
        quantidadeRepor: Math.ceil((e.produto.demandaPrevista30d || 0) - e.quantidade),
        prioridade: e.quantidade / ((e.produto.demandaPrevista7d || 1) / 7) < 1 ? 'CRITICA' : 'ALTA'
      }));

    // Calcular giro por categoria
    const categorias = await prisma.produto.groupBy({
      by: ['categoria'],
      where: {
        estoques: {
          some: {
            unidade: { mercadoId }
          }
        }
      },
      _avg: {
        giroEstoqueMedio: true
      }
    });

    const giroPorCategoria = categorias.map(c => ({
      categoria: c.categoria || 'Sem categoria',
      giro: c._avg.giroEstoqueMedio || 0,
      status: (c._avg.giroEstoqueMedio || 0) > 4 ? 'ACIMA' : ((c._avg.giroEstoqueMedio || 0) < 2 ? 'ABAIXO' : 'MEDIA')
    }));

    res.json({
      success: true,
      data: {
        giroPorCategoria,
        produtosEmRuptura,
        resumo: {
          totalProdutos: estoques.length,
          emRupturaCritica: produtosEmRuptura.filter(p => p.prioridade === 'CRITICA').length,
          emRupturaAlta: produtosEmRuptura.filter(p => p.prioridade === 'ALTA').length,
          giroMedio: giroPorCategoria.reduce((acc, g) => acc + g.giro, 0) / (giroPorCategoria.length || 1)
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar módulo de compras:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar módulo de compras' 
    });
  }
});

// ============================================
// ALERTAS
// ============================================

router.get('/alertas/:mercadoId', authenticate, async (req, res) => {
  try {
    const { mercadoId } = req.params;
    
    const alertas = await prisma.alertaIA.findMany({
      where: {
        mercadoId,
        lido: false
      },
      orderBy: [
        { prioridade: 'desc' },
        { criadoEm: 'desc' }
      ],
      include: {
        produto: { select: { nome: true } },
        unidade: { select: { nome: true } }
      }
    });

    res.json({
      success: true,
      data: alertas
    });

  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar alertas' 
    });
  }
});

router.put('/alertas/:alertaId/marcar-lido', authenticate, async (req, res) => {
  try {
    const { alertaId } = req.params;
    
    const alerta = await prisma.alertaIA.update({
      where: { id: alertaId },
      data: {
        lido: true,
        lidoEm: new Date()
      }
    });

    res.json({
      success: true,
      data: alerta
    });

  } catch (error) {
    console.error('Erro ao marcar alerta como lido:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao marcar alerta como lido' 
    });
  }
});

module.exports = router;

