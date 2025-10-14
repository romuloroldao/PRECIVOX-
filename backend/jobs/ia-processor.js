#!/usr/bin/env node

/**
 * Job de Processamento de IA - PRECIVOX
 * Roda diariamente às 2h AM
 * 
 * Tarefas:
 * - Atualizar previsões de demanda
 * - Calcular giro de estoque
 * - Atualizar métricas do dashboard
 * - Gerar análises de produtos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🤖 [IA PROCESSOR] Iniciando processamento diário...');
  const inicio = Date.now();

  try {
    // 1. Buscar todos os mercados ativos
    const mercados = await prisma.mercado.findMany({
      where: { ativo: true },
      include: {
        unidades: {
          where: { ativa: true },
          include: {
            estoques: {
              include: { produto: true }
            }
          }
        }
      }
    });

    console.log(`📊 [IA] Processando ${mercados.length} mercados ativos...`);

    for (const mercado of mercados) {
      console.log(`\n🏪 [IA] Mercado: ${mercado.nome} (${mercado.id})`);

      try {
        // 2. Atualizar previsão de demanda
        await atualizarPrevisaoDemanda(mercado);
        console.log('  ✓ Previsão de demanda atualizada');

        // 3. Calcular giro de estoque
        await calcularGiroEstoque(mercado);
        console.log('  ✓ Giro de estoque calculado');

        // 4. Atualizar métricas do dashboard
        await atualizarMetricasDashboard(mercado);
        console.log('  ✓ Métricas atualizadas');

        // 5. Gerar alertas de ruptura
        const alertas = await gerarAlertasRuptura(mercado);
        console.log(`  ✓ ${alertas} alertas de ruptura gerados`);

        // 6. Identificar oportunidades de promoção
        await identificarOportunidadesPromocao(mercado);
        console.log('  ✓ Oportunidades de promoção identificadas');

      } catch (error) {
        console.error(`  ✗ Erro ao processar mercado ${mercado.nome}:`, error.message);
      }
    }

    const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
    console.log(`\n✅ [IA] Processamento concluído em ${duracao}s`);

  } catch (error) {
    console.error('❌ [IA] Erro no processamento:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Atualizar previsão de demanda para todos os produtos
 */
async function atualizarPrevisaoDemanda(mercado) {
  for (const unidade of mercado.unidades) {
    for (const estoque of unidade.estoques) {
      // Simular previsão de demanda (em produção, usar ARIMA/Prophet)
      const demandaMedia = Math.floor(Math.random() * 20) + 5; // 5-25 unidades/dia
      const demanda7d = demandaMedia * 7;
      const demanda30d = demandaMedia * 30;
      
      // Calcular ponto de reposição
      const leadTime = 5; // dias
      const estoqueSeguranca = Math.ceil(demanda7d * 0.3);
      const pontoReposicao = (demandaMedia * leadTime) + estoqueSeguranca;

      await prisma.produto.update({
        where: { id: estoque.produtoId },
        data: {
          demandaPrevista7d: demanda7d,
          demandaPrevista30d: demanda30d,
          pontoReposicao: pontoReposicao,
          ultimaAtualizacaoIA: new Date()
        }
      });
    }
  }
}

/**
 * Calcular giro de estoque
 */
async function calcularGiroEstoque(mercado) {
  for (const unidade of mercado.unidades) {
    for (const estoque of unidade.estoques) {
      // Simular cálculo de giro (em produção, usar vendas reais)
      const giro = (Math.random() * 10).toFixed(1); // 0-10x/mês
      
      // Classificação ABC
      let categoriaABC = 'C';
      if (giro > 6) categoriaABC = 'A';
      else if (giro > 3) categoriaABC = 'B';

      await prisma.produto.update({
        where: { id: estoque.produtoId },
        data: {
          giroEstoqueMedio: parseFloat(giro),
          categoriaABC: categoriaABC
        }
      });
    }
  }
}

/**
 * Atualizar métricas do dashboard
 */
async function atualizarMetricasDashboard(mercado) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Buscar todos os estoques do mercado
  const estoques = await prisma.estoque.findMany({
    where: {
      unidade: { mercadoId: mercado.id }
    },
    include: {
      produto: true
    }
  });

  // Calcular métricas
  const totalProdutos = estoques.length;
  const produtosAtivos = estoques.filter(e => e.disponivel).length;
  
  // Giro médio
  const giroMedio = estoques.reduce((acc, e) => acc + (e.produto.giroEstoqueMedio || 0), 0) / totalProdutos;
  
  // Taxa de ruptura (produtos abaixo do ponto de reposição)
  const produtosEmRuptura = estoques.filter(e => {
    return e.quantidade < (e.produto.pontoReposicao || 0);
  }).length;
  const taxaRuptura = (produtosEmRuptura / totalProdutos) * 100;

  // Valor total do estoque
  const valorEstoque = estoques.reduce((acc, e) => {
    return acc + (Number(e.preco) * e.quantidade);
  }, 0);

  // Simular outras métricas
  const ticketMedio = 75 + Math.random() * 30; // R$ 75-105
  const margemLiquida = 15 + Math.random() * 8; // 15-23%

  // Criar/atualizar métricas
  await prisma.metricasDashboard.upsert({
    where: {
      mercadoId_data_periodo: {
        mercadoId: mercado.id,
        data: hoje,
        periodo: 'DIA'
      }
    },
    update: {
      giroEstoqueGeral: giroMedio,
      taxaRuptura: taxaRuptura,
      valorEstoque: valorEstoque,
      produtosAtivos: produtosAtivos,
      ticketMedio: ticketMedio.toFixed(2),
      margemLiquida: margemLiquida,
      quantidadeVendas: Math.floor(Math.random() * 100) + 20,
      faturamentoDia: ticketMedio * (Math.floor(Math.random() * 100) + 20)
    },
    create: {
      mercadoId: mercado.id,
      data: hoje,
      periodo: 'DIA',
      giroEstoqueGeral: giroMedio,
      taxaRuptura: taxaRuptura,
      valorEstoque: valorEstoque,
      produtosAtivos: produtosAtivos,
      ticketMedio: ticketMedio.toFixed(2),
      margemLiquida: margemLiquida,
      quantidadeVendas: Math.floor(Math.random() * 100) + 20,
      faturamentoDia: ticketMedio * (Math.floor(Math.random() * 100) + 20)
    }
  });
}

/**
 * Gerar alertas de ruptura
 */
async function gerarAlertasRuptura(mercado) {
  let alertasGerados = 0;

  for (const unidade of mercado.unidades) {
    for (const estoque of unidade.estoques) {
      const { produto } = estoque;
      
      if (!produto.demandaPrevista7d) continue;

      const demandaDiaria = produto.demandaPrevista7d / 7;
      const diasRestantes = estoque.quantidade / (demandaDiaria || 1);

      let prioridade = null;
      let titulo = null;
      let descricao = null;

      if (diasRestantes < 1) {
        prioridade = 'CRITICA';
        titulo = `🚨 RUPTURA CRÍTICA: ${produto.nome}`;
        descricao = `Estoque atual de ${estoque.quantidade} unidades. Previsão de ruptura em menos de 24 horas!`;
      } else if (diasRestantes < 3) {
        prioridade = 'ALTA';
        titulo = `⚠️ Ruptura iminente: ${produto.nome}`;
        descricao = `Estoque atual de ${estoque.quantidade} unidades. Previsão de ruptura em ${Math.round(diasRestantes)} dias.`;
      }

      if (prioridade) {
        // Verificar se já existe alerta similar não lido
        const alertaExistente = await prisma.alertaIA.findFirst({
          where: {
            mercadoId: mercado.id,
            unidadeId: unidade.id,
            produtoId: produto.id,
            tipo: 'RUPTURA',
            lido: false
          }
        });

        if (!alertaExistente) {
          const quantidadeRepor = Math.ceil(produto.demandaPrevista30d - estoque.quantidade);

          await prisma.alertaIA.create({
            data: {
              mercadoId: mercado.id,
              unidadeId: unidade.id,
              produtoId: produto.id,
              tipo: 'RUPTURA',
              titulo,
              descricao,
              prioridade,
              acaoRecomendada: `Repor ${quantidadeRepor} unidades de "${produto.nome}" na unidade ${unidade.nome}.`,
              metadata: {
                estoqueAtual: estoque.quantidade,
                diasRestantes: Math.round(diasRestantes * 10) / 10,
                quantidadeSugerida: quantidadeRepor
              }
            }
          });

          alertasGerados++;
        }
      }
    }
  }

  return alertasGerados;
}

/**
 * Identificar oportunidades de promoção
 */
async function identificarOportunidadesPromocao(mercado) {
  const estoques = await prisma.estoque.findMany({
    where: {
      unidade: { mercadoId: mercado.id },
      quantidade: { gte: 100 }, // Estoque alto
      produto: {
        giroEstoqueMedio: { lt: 3 } // Giro baixo
      }
    },
    include: {
      produto: true,
      unidade: { select: { nome: true } }
    },
    take: 3 // Top 3 oportunidades
  });

  for (const estoque of estoques) {
    // Verificar se já existe alerta
    const alertaExistente = await prisma.alertaIA.findFirst({
      where: {
        mercadoId: mercado.id,
        produtoId: estoque.produtoId,
        tipo: 'OPORTUNIDADE',
        lido: false
      }
    });

    if (!alertaExistente) {
      const descontoSugerido = 8 + Math.floor(Math.random() * 5); // 8-12%
      const aumentoEstimado = Math.abs(estoque.produto.elasticidadePreco || -1.5) * descontoSugerido;

      await prisma.alertaIA.create({
        data: {
          mercadoId: mercado.id,
          unidadeId: estoque.unidadeId,
          produtoId: estoque.produtoId,
          tipo: 'OPORTUNIDADE',
          titulo: `💰 Oportunidade: Promoção em ${estoque.produto.nome}`,
          descricao: `Estoque alto (${estoque.quantidade} unidades) com giro lento (${estoque.produto.giroEstoqueMedio}x/mês).`,
          prioridade: 'MEDIA',
          acaoRecomendada: `Aplicar desconto de ${descontoSugerido}% por 15 dias. Impacto esperado: +${aumentoEstimado.toFixed(1)}% vendas.`,
          metadata: {
            estoqueAtual: estoque.quantidade,
            giroAtual: estoque.produto.giroEstoqueMedio,
            descontoSugerido,
            aumentoEstimado: aumentoEstimado.toFixed(1)
          }
        }
      });
    }
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ Processamento finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { main };

