/**
 * Espera que vale — timing de promoção / volatilidade regional por SKU (Épico 7.4)
 */

import { prisma } from '@/lib/prisma';
import { EventCollector } from '@/lib/ai/event-collector';

export type RecomendacaoTiming = 'comprar_agora' | 'esperar' | 'neutro' | 'promo_ativa';

export type AnaliseVolatilidade = {
  produtoId: string;
  nome: string;
  precoAtual: number;
  precoMin90d: number | null;
  precoMax90d: number | null;
  volatilidadePct: number | null;
  tendenciaPct: number | null;
  recomendacao: RecomendacaoTiming;
  mensagem: string;
  confianca: number;
  emPromocao: boolean;
};

type PontoPreco = { preco: number; data: Date };

function media(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function statsPrecos(precos: number[]) {
  if (precos.length < 2) return null;
  const mean = media(precos);
  const variance = precos.reduce((s, p) => s + (p - mean) ** 2, 0) / precos.length;
  const std = Math.sqrt(variance);
  const cv = mean > 0 ? (std / mean) * 100 : 0;
  return {
    mean,
    min: Math.min(...precos),
    max: Math.max(...precos),
    volatilidadePct: Math.round(cv * 10) / 10,
  };
}

function tendenciaPrecos(pontos: PontoPreco[]): number | null {
  if (pontos.length < 4) return null;
  const mid = Math.floor(pontos.length / 2);
  const avg1 = media(pontos.slice(0, mid).map((p) => p.preco));
  const avg2 = media(pontos.slice(mid).map((p) => p.preco));
  if (avg1 <= 0) return null;
  return Math.round(((avg2 - avg1) / avg1) * 1000) / 10;
}

async function historicoVendasRegional(
  produtoId: string,
  mercadoId: string,
  dias = 90
): Promise<PontoPreco[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - dias);

  const vendas = await prisma.vendas.findMany({
    where: {
      produtoId,
      dataVenda: { gte: cutoff },
      unidades: { mercadoId },
    },
    select: { precoUnitario: true, dataVenda: true },
    orderBy: { dataVenda: 'asc' },
    take: 500,
  });

  return vendas.map((v) => ({
    preco: v.precoUnitario.toNumber(),
    data: v.dataVenda,
  }));
}

async function precoAtualMercado(
  produtoId: string,
  mercadoId: string
): Promise<{
  preco: number;
  emPromocao: boolean;
  nome: string;
} | null> {
  const est = await prisma.estoques.findFirst({
    where: {
      produtoId,
      disponivel: true,
      unidades: { mercadoId, ativa: true },
    },
    orderBy: [{ emPromocao: 'desc' }, { preco: 'asc' }],
    select: {
      preco: true,
      precoPromocional: true,
      emPromocao: true,
      produtos: { select: { nome: true } },
    },
  });
  if (!est) return null;

  const preco =
    est.emPromocao && est.precoPromocional
      ? est.precoPromocional.toNumber()
      : est.preco.toNumber();

  return {
    preco,
    emPromocao: est.emPromocao,
    nome: est.produtos.nome ?? 'Produto',
  };
}

async function volatilidadeCategoriaRegional(
  categoria: string | null | undefined,
  mercadoId: string
): Promise<{ volatilidadePct: number; precoMedio: number } | null> {
  if (!categoria?.trim()) return null;

  const estoques = await prisma.estoques.findMany({
    where: {
      disponivel: true,
      produtos: { categoria: { equals: categoria, mode: 'insensitive' } },
      unidades: { mercadoId, ativa: true },
    },
    select: { preco: true, precoPromocional: true, emPromocao: true },
    take: 80,
  });

  if (estoques.length < 3) return null;

  const precos = estoques.map((e) =>
    e.emPromocao && e.precoPromocional ? e.precoPromocional.toNumber() : e.preco.toNumber()
  );
  const st = statsPrecos(precos);
  if (!st) return null;
  return { volatilidadePct: st.volatilidadePct, precoMedio: st.mean };
}

function decidirRecomendacao(params: {
  precoAtual: number;
  emPromocao: boolean;
  stats: ReturnType<typeof statsPrecos>;
  tendenciaPct: number | null;
  volatilidadeCategoria: number | null;
  amostras: number;
}): { recomendacao: RecomendacaoTiming; mensagem: string; confianca: number } {
  const { precoAtual, emPromocao, stats, tendenciaPct, volatilidadeCategoria, amostras } =
    params;

  let confianca = Math.min(95, 35 + amostras * 8);
  if (volatilidadeCategoria != null && amostras < 3) {
    confianca = Math.min(70, 45 + volatilidadeCategoria);
  }

  if (emPromocao) {
    return {
      recomendacao: 'promo_ativa',
      mensagem: 'Promoção ativa no mercado — bom momento para comprar.',
      confianca: Math.max(confianca, 75),
    };
  }

  if (stats && stats.max > stats.min) {
    const faixa = stats.max - stats.min;
    const posicao = faixa > 0 ? (precoAtual - stats.min) / faixa : 0.5;
    const vol = stats.volatilidadePct;

    if (posicao <= 0.15) {
      return {
        recomendacao: 'comprar_agora',
        mensagem: `Preço perto do mínimo regional (90d) — volatilidade ~${vol}%.`,
        confianca,
      };
    }

    if (posicao >= 0.85 && vol >= 6) {
      return {
        recomendacao: 'esperar',
        mensagem: `Preço no topo da faixa regional — volatilidade ~${vol}%; vale esperar.`,
        confianca,
      };
    }

    if (tendenciaPct != null && tendenciaPct >= 6) {
      return {
        recomendacao: 'comprar_agora',
        mensagem: `Tendência de alta (~${tendenciaPct}% no período) — comprar agora pode evitar piora.`,
        confianca,
      };
    }

    if (tendenciaPct != null && tendenciaPct <= -6) {
      return {
        recomendacao: 'esperar',
        mensagem: `Preço em queda (~${Math.abs(tendenciaPct)}%) — esperar pode render economia.`,
        confianca,
      };
    }

    if (vol >= 12 && posicao >= 0.55) {
      return {
        recomendacao: 'esperar',
        mensagem: `SKU volátil na região (~${vol}%) e preço acima da média recente.`,
        confianca,
      };
    }

    if (vol < 5) {
      return {
        recomendacao: 'neutro',
        mensagem: 'Preço estável na região — sem sinal forte de espera.',
        confianca: Math.min(confianca, 60),
      };
    }
  }

  if (volatilidadeCategoria != null && volatilidadeCategoria >= 10) {
    return {
      recomendacao: 'esperar',
      mensagem: `Categoria volátil na região (~${volatilidadeCategoria}%) — observe promoções.`,
      confianca: 50,
    };
  }

  return {
    recomendacao: 'neutro',
    mensagem: 'Dados regionais insuficientes — acompanhe promoções no app.',
    confianca: 40,
  };
}

export async function analisarVolatilidadeProduto(
  produtoId: string,
  mercadoId: string
): Promise<AnaliseVolatilidade | null> {
  const atual = await precoAtualMercado(produtoId, mercadoId);
  if (!atual) return null;

  const produto = await prisma.produtos.findUnique({
    where: { id: produtoId },
    select: { categoria: true, nome: true },
  });

  const historico = await historicoVendasRegional(produtoId, mercadoId);
  const precosHist = historico.map((p) => p.preco);
  const stats = statsPrecos(precosHist);
  const tendenciaPct = tendenciaPrecos(historico);
  const volCat = await volatilidadeCategoriaRegional(produto?.categoria, mercadoId);

  const { recomendacao, mensagem, confianca } = decidirRecomendacao({
    precoAtual: atual.preco,
    emPromocao: atual.emPromocao,
    stats,
    tendenciaPct,
    volatilidadeCategoria: volCat?.volatilidadePct ?? null,
    amostras: precosHist.length,
  });

  return {
    produtoId,
    nome: produto?.nome ?? atual.nome,
    precoAtual: atual.preco,
    precoMin90d: stats?.min ?? null,
    precoMax90d: stats?.max ?? null,
    volatilidadePct: stats?.volatilidadePct ?? volCat?.volatilidadePct ?? null,
    tendenciaPct,
    recomendacao,
    mensagem,
    confianca,
    emPromocao: atual.emPromocao,
  };
}

export async function listarEsperaQueValeUsuario(
  userId: string,
  mercadoId: string,
  limite = 6
): Promise<{
  itens: AnaliseVolatilidade[];
  resumo: string;
  aguardar: number;
  comprarAgora: number;
}> {
  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 60);

  const eventos = await EventCollector.getUserEvents(userId, mercadoId, inicio, fim);
  const freq = new Map<string, number>();

  for (const ev of eventos) {
    if (!['produto_adicionado_lista', 'produto_buscado', 'compra_confirmada'].includes(ev.type)) {
      continue;
    }
    const pid = (ev.metadata as { produtoId?: string }).produtoId;
    if (pid) freq.set(pid, (freq.get(pid) ?? 0) + 1);
  }

  const topIds = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([id]) => id);

  if (topIds.length === 0) {
    return {
      itens: [],
      resumo: 'Use listas e buscas para receber dicas de quando esperar ou comprar.',
      aguardar: 0,
      comprarAgora: 0,
    };
  }

  const analises: AnaliseVolatilidade[] = [];
  for (const pid of topIds) {
    const a = await analisarVolatilidadeProduto(pid, mercadoId);
    if (a && a.recomendacao !== 'neutro') analises.push(a);
  }

  analises.sort((a, b) => {
    const peso = (r: RecomendacaoTiming) =>
      r === 'esperar' ? 3 : r === 'comprar_agora' || r === 'promo_ativa' ? 2 : 1;
    return peso(b.recomendacao) * b.confianca - peso(a.recomendacao) * a.confianca;
  });

  const itens = analises.slice(0, limite);
  const aguardar = itens.filter((i) => i.recomendacao === 'esperar').length;
  const comprarAgora = itens.filter(
    (i) => i.recomendacao === 'comprar_agora' || i.recomendacao === 'promo_ativa'
  ).length;

  let resumo = 'Sem sinais fortes de timing na sua cesta agora.';
  if (aguardar > 0 && comprarAgora > 0) {
    resumo = `${aguardar} item(ns): vale esperar · ${comprarAgora} em bom momento para comprar.`;
  } else if (aguardar > 0) {
    resumo = `${aguardar} item(ns) da sua cesta estão caros na faixa regional — considere esperar.`;
  } else if (comprarAgora > 0) {
    resumo = `${comprarAgora} item(ns) com preço favorável ou promo ativa na região.`;
  }

  return { itens, resumo, aguardar, comprarAgora };
}
