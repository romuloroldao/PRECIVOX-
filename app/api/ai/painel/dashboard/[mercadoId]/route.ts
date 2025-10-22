// API Route: Dashboard de IA para o mercado
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { mercadoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const mercadoId = params.mercadoId;
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    // Verificar se mercado existe e se usuário tem acesso
    const mercado = await prisma.mercados.findUnique({
      where: { id: mercadoId }
    });

    if (!mercado) {
      return NextResponse.json(
        { success: false, error: 'Mercado não encontrado' },
        { status: 404 }
      );
    }

    if (userRole === 'GESTOR' && mercado.gestorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // 1. Buscar alertas críticos
    const alertasCriticos = await prisma.alertas_ia.findMany({
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
        produtos: {
          select: { nome: true }
        },
        unidades: {
          select: { nome: true }
        }
      }
    });

    // 2. Buscar métricas do dia atual
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let metricas = await prisma.metricas_dashboard.findFirst({
      where: {
        mercadoId,
        data: hoje,
        periodo: 'DIA'
      }
    });

    // Se não existir, criar métricas iniciais (mock para demonstração)
    if (!metricas) {
      metricas = await prisma.metricas_dashboard.create({
        data: {
          id: `metrica-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          mercadoId,
          data: hoje,
          periodo: 'DIA',
          giroEstoqueGeral: 4.2,
          taxaRuptura: 2.3,
          ticketMedio: 87.30,
          margemLiquida: 18.5
        }
      });
    }

    // 3. Contar análises pendentes por módulo
    const analisesPendentes = await prisma.analises_ia.groupBy({
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
    const unidades = await prisma.unidades.findMany({
      where: { mercadoId, ativa: true },
      select: {
        id: true,
        nome: true,
        _count: {
          select: { estoques: true }
        }
      }
    });

    // 5. Calcular variações (comparar com ontem)
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    const metricasOntem = await prisma.metricas_dashboard.findFirst({
      where: {
        mercadoId,
        data: ontem,
        periodo: 'DIA'
      }
    });

    const calcularVariacao = (atual: number, anterior: number) => {
      if (!anterior || anterior === 0) return 0;
      return Number((((atual - anterior) / anterior) * 100).toFixed(1));
    };

    const variacoes = metricasOntem
      ? {
          giroEstoque: calcularVariacao(metricas.giroEstoqueGeral, metricasOntem.giroEstoqueGeral),
          taxaRuptura: calcularVariacao(metricas.taxaRuptura, metricasOntem.taxaRuptura),
          ticketMedio: calcularVariacao(Number(metricas.ticketMedio), Number(metricasOntem.ticketMedio)),
          margemLiquida: calcularVariacao(metricas.margemLiquida, metricasOntem.margemLiquida)
        }
      : {
          giroEstoque: 3.5,
          taxaRuptura: -12.5,
          ticketMedio: 8.2,
          margemLiquida: -2.3
        };

    // 6. Resposta estruturada
    return NextResponse.json({
      success: true,
      data: {
        alertasCriticos: alertasCriticos.map((a) => ({
          id: a.id,
          tipo: a.tipo,
          titulo: a.titulo,
          descricao: a.descricao,
          prioridade: a.prioridade,
          acaoRecomendada: a.acaoRecomendada,
          linkAcao: a.linkAcao,
          produto: a.produtos?.nome,
          unidade: a.unidades?.nome,
          criadoEm: a.criadoEm
        })),

        visaoExecutiva: {
          giroEstoque: {
            valor: Number(metricas.giroEstoqueGeral.toFixed(1)),
            variacao: variacoes.giroEstoque,
            tendencia: variacoes.giroEstoque > 0 ? 'up' : 'down'
          },
          taxaRuptura: {
            valor: Number(metricas.taxaRuptura.toFixed(1)),
            variacao: variacoes.taxaRuptura,
            tendencia: variacoes.taxaRuptura < 0 ? 'up' : 'down' // Negativo é bom
          },
          ticketMedio: {
            valor: Number(metricas.ticketMedio),
            variacao: variacoes.ticketMedio,
            tendencia: variacoes.ticketMedio > 0 ? 'up' : 'down'
          },
          margemLiquida: {
            valor: Number(metricas.margemLiquida.toFixed(1)),
            variacao: variacoes.margemLiquida,
            tendencia: variacoes.margemLiquida > 0 ? 'up' : 'down'
          }
        },

        modulosIA: {
          compras: {
            insightsPendentes:
              analisesPendentes.find((a) => a.tipo === 'DEMANDA')?._count.id || 0
          },
          promocoes: {
            oportunidades:
              analisesPendentes.find((a) => a.tipo === 'PROMOCAO')?._count.id || 0
          },
          conversao: {
            acoesSugeridas:
              analisesPendentes.find((a) => a.tipo === 'PERFORMANCE')?._count.id || 0
          }
        },

        unidades,

        ultimaAtualizacao: new Date()
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard IA:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar dashboard de IA' },
      { status: 500 }
    );
  }
}






