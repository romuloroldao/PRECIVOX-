import { prisma } from '@/lib/prisma';
import type {
  DemandPrediction,
  PricingRecommendation,
  StockAlert,
  StockHealthData,
} from '@/lib/ai-api';

type AnaliseResultado = {
  demandaPrevista?: number;
  elasticidade?: number;
  recomendacaoPreco?: number;
  confianca?: number;
};

function asResultado(value: unknown): AnaliseResultado {
  if (!value || typeof value !== 'object') return {};
  return value as AnaliseResultado;
}

export async function loadDemandPredictions(mercadoId: string): Promise<DemandPrediction[]> {
  const analises = await prisma.analises_ia.findMany({
    where: {
      mercadoId,
      tipo: { in: ['DEMANDA', 'SAZONALIDADE', 'ESTOQUE'] },
    },
    include: { produtos: { select: { nome: true } } },
    orderBy: { criadoEm: 'desc' },
    take: 24,
  });

  if (analises.length > 0) {
    return analises.map((a) => {
      const r = asResultado(a.resultado);
      const demanda = r.demandaPrevista ?? Number(a.impactoEstimado ?? 100);
      const confianca = r.confianca ?? 0.82;
      const tendencia: DemandPrediction['tendencia'] =
        demanda > 200 ? 'alta' : demanda < 80 ? 'baixa' : 'estavel';
      return {
        produtoId: a.produtoId ?? a.id,
        produtoNome: a.produtos?.nome ?? 'Produto',
        demandaPrevista: Math.round(demanda),
        confianca,
        tendencia,
      };
    });
  }

  const estoques = await prisma.estoques.findMany({
    where: {
      disponivel: true,
      unidades: { mercadoId, ativa: true },
      produtos: { ativo: true },
    },
    include: { produtos: { select: { nome: true } } },
    take: 12,
    orderBy: { quantidade: 'desc' },
  });

  return estoques.map((e) => ({
    produtoId: e.produtoId,
    produtoNome: e.produtos.nome,
    demandaPrevista: Math.max(20, Math.round(e.quantidade * 1.4)),
    confianca: 0.75,
    tendencia: e.quantidade <= 3 ? 'alta' : 'estavel',
  }));
}

export async function loadStockHealth(mercadoId: string): Promise<StockHealthData> {
  const [alertasDb, estoques] = await Promise.all([
    prisma.alertas_ia.findMany({
      where: {
        mercadoId,
        lido: false,
        OR: [{ expiradoEm: null }, { expiradoEm: { gt: new Date() } }],
      },
      include: { produtos: { select: { nome: true } } },
      orderBy: { criadoEm: 'desc' },
      take: 20,
    }),
    prisma.estoques.findMany({
      where: {
        disponivel: true,
        unidades: { mercadoId, ativa: true },
        produtos: { ativo: true },
      },
      include: { produtos: { select: { nome: true } } },
    }),
  ]);

  const alertas: StockAlert[] = alertasDb.map((a) => ({
    tipo:
      a.tipo === 'RUPTURA'
        ? 'ruptura'
        : a.tipo === 'VALIDADE'
          ? 'vencimento'
          : 'excesso',
    produtoId: a.produtoId ?? a.id,
    produtoNome: a.produtos?.nome ?? a.titulo,
    severidade:
      a.prioridade === 'ALTA' || a.prioridade === 'CRITICA'
        ? 'alta'
        : a.prioridade === 'MEDIA'
          ? 'media'
          : 'baixa',
    diasEstoque: a.tipo === 'RUPTURA' ? 2 : 7,
    mensagem: a.descricao,
  }));

  const produtosRisco = estoques
    .filter((e) => e.quantidade <= 5)
    .slice(0, 12)
    .map((e) => ({
      id: e.produtoId,
      nome: e.produtos.nome,
      diasEstoque: Math.max(1, e.quantidade),
      risco: e.quantidade <= 2 ? 0.9 : 0.55,
    }));

  const produtosExcesso = estoques
    .filter((e) => e.quantidade >= 40)
    .slice(0, 8)
    .map((e) => ({
      id: e.produtoId,
      nome: e.produtos.nome,
      diasEstoque: Math.round(e.quantidade / 4),
    }));

  const rupturaRatio = estoques.length
    ? produtosRisco.length / estoques.length
    : 0;
  const score = Math.round(Math.max(35, Math.min(95, 88 - rupturaRatio * 120)));

  return {
    score,
    alertas,
    produtosRisco,
    produtosExcesso,
  };
}

export async function loadPricingRecommendations(
  mercadoId: string
): Promise<PricingRecommendation[]> {
  const analises = await prisma.analises_ia.findMany({
    where: {
      mercadoId,
      tipo: { in: ['PRECO', 'PROMOCAO'] },
    },
    include: { produtos: { select: { nome: true } } },
    orderBy: { criadoEm: 'desc' },
    take: 16,
  });

  if (analises.length > 0) {
    return analises.map((a) => {
      const r = asResultado(a.resultado);
      const precoAtual = Number(r.recomendacaoPreco ?? 10) / (r.elasticidade ? 1.02 : 1);
      const precoSugerido = Number(r.recomendacaoPreco ?? precoAtual);
      const elasticidade = r.elasticidade ?? -1.2;
      const delta = precoSugerido - precoAtual;
      return {
        produtoId: a.produtoId ?? a.id,
        produtoNome: a.produtos?.nome ?? 'Produto',
        precoAtual: Math.round(precoAtual * 100) / 100,
        precoSugerido: Math.round(precoSugerido * 100) / 100,
        elasticidade,
        impactoEstimado: {
          vendas: Math.round(Math.abs(delta) * 8),
          receita: Number(a.impactoEstimado ?? Math.abs(delta) * 120),
        },
      };
    });
  }

  const estoques = await prisma.estoques.findMany({
    where: {
      disponivel: true,
      unidades: { mercadoId, ativa: true },
      produtos: { ativo: true },
    },
    include: { produtos: { select: { nome: true } } },
    take: 10,
    orderBy: { quantidade: 'desc' },
  });

  return estoques.map((e) => {
    const precoAtual = Number(e.preco);
    const precoSugerido = Math.round(precoAtual * 0.97 * 100) / 100;
    return {
      produtoId: e.produtoId,
      produtoNome: e.produtos.nome,
      precoAtual,
      precoSugerido,
      elasticidade: -1.1,
      impactoEstimado: { vendas: 12, receita: precoAtual * 15 },
    };
  });
}
