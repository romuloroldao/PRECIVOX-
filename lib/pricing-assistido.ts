/**
 * Pricing assistido — sugestões explicáveis + aprovação 1 tap (Épico 10.2)
 */

import { prisma } from '@/lib/prisma';
import { PromotionEngine } from '@/lib/ai/promotion-engine';
import { getRadarDemandaMercado } from '@/lib/radar-demanda';
import { CONFIANCA } from '@/lib/estoque-truth';
import { notificarWebhookPrecoAlterado } from '@/lib/parceiro-webhook-preco';

export type SugestaoPricingAssistido = {
  id: string;
  produtoId: string;
  produtoNome: string;
  estoqueId: string;
  unidadeId: string;
  unidadeNome: string;
  precoAtual: number;
  precoPromocionalSugerido: number;
  descontoPct: number;
  duracaoDias: number;
  motivo: string;
  impactoEsperado: {
    aumentoVendas: number;
    impactoMargem: number;
    impactoGiro: number;
  };
  confianca: number;
  demandaBairro: boolean;
  jaEmPromocao: boolean;
};

export type PricingAssistidoResumo = {
  mercadoId: string;
  sugestoes: SugestaoPricingAssistido[];
  explicacao: string;
  confiancaMedia: number;
};

function arredondarPreco(v: number): number {
  return Math.round(v * 100) / 100;
}

/** Heurística local quando o PromotionEngine não retorna match do mercado. */
function sugestaoFallbackEstoque(input: {
  produtoId: string;
  produtoNome: string;
  estoqueId: string;
  unidadeId: string;
  unidadeNome: string;
  preco: number;
  quantidade: number;
  emPromocao: boolean;
  demandaBairro: boolean;
}): SugestaoPricingAssistido | null {
  if (input.emPromocao) return null;

  let descontoPct = 0;
  const motivos: string[] = [];

  if (input.quantidade >= 200) {
    descontoPct = 15;
    motivos.push(`Estoque alto (${input.quantidade} un.) — acelerar giro`);
  } else if (input.quantidade >= 80) {
    descontoPct = 10;
    motivos.push(`Estoque elevado (${input.quantidade} un.)`);
  }

  if (input.demandaBairro) {
    descontoPct = Math.max(descontoPct, 8);
    motivos.push('Demanda do bairro em alta (radar PRECIVOX)');
  }

  if (descontoPct === 0) return null;

  const aumentoVendas = descontoPct * 1.5;
  const precoPromo = arredondarPreco(input.preco * (1 - descontoPct / 100));

  return {
    id: `pricing-${input.estoqueId}`,
    produtoId: input.produtoId,
    produtoNome: input.produtoNome,
    estoqueId: input.estoqueId,
    unidadeId: input.unidadeId,
    unidadeNome: input.unidadeNome,
    precoAtual: input.preco,
    precoPromocionalSugerido: precoPromo,
    descontoPct,
    duracaoDias: input.quantidade >= 200 ? 7 : 5,
    motivo: motivos.join(' · '),
    impactoEsperado: {
      aumentoVendas: Math.round(aumentoVendas * 10) / 10,
      impactoMargem: -descontoPct,
      impactoGiro: Math.round((input.quantidade * 0.05) * 10) / 10,
    },
    confianca: input.demandaBairro ? 78 : 65,
    demandaBairro: input.demandaBairro,
    jaEmPromocao: false,
  };
}

export async function getSugestoesPricingAssistido(
  mercadoId: string,
  limite = 8
): Promise<PricingAssistidoResumo> {
  const unidades = await prisma.unidades.findMany({
    where: { mercadoId, ativa: true },
    select: { id: true, nome: true },
  });
  const unidadeIds = unidades.map((u) => u.id);

  if (unidadeIds.length === 0) {
    return {
      mercadoId,
      sugestoes: [],
      explicacao: 'Cadastre uma unidade ativa para receber sugestões de promoção.',
      confiancaMedia: 0,
    };
  }

  const [estoques, radar, engine] = await Promise.all([
    prisma.estoques.findMany({
      where: { unidadeId: { in: unidadeIds }, disponivel: true },
      include: {
        produtos: { select: { id: true, nome: true, pontoReposicao: true } },
        unidades: { select: { id: true, nome: true } },
      },
      orderBy: { quantidade: 'desc' },
      take: 120,
    }),
    getRadarDemandaMercado(mercadoId, 7).catch(() => null),
    PromotionEngine.generatePromotionSuggestions(mercadoId, limite * 3),
  ]);

  const demandaIds = new Set((radar?.itens ?? []).map((i) => i.produtoId));
  const estoquePorProduto = new Map<string, (typeof estoques)[0]>();
  for (const e of estoques) {
    if (!estoquePorProduto.has(e.produtoId)) estoquePorProduto.set(e.produtoId, e);
  }

  const sugestoes: SugestaoPricingAssistido[] = [];
  const usados = new Set<string>();

  for (const promo of engine.data) {
    const est = estoquePorProduto.get(promo.produtoId);
    if (!est || usados.has(est.id)) continue;

    const precoAtual = Number(est.preco);
    const descontoPct = Math.min(35, Math.max(5, Math.round(promo.valor)));
    const precoPromo = arredondarPreco(precoAtual * (1 - descontoPct / 100));
    const demandaBairro = demandaIds.has(promo.produtoId);

    sugestoes.push({
      id: promo.id,
      produtoId: promo.produtoId,
      produtoNome: est.produtos.nome,
      estoqueId: est.id,
      unidadeId: est.unidadeId,
      unidadeNome: est.unidades.nome,
      precoAtual,
      precoPromocionalSugerido: precoPromo,
      descontoPct,
      duracaoDias: promo.duracao,
      motivo: demandaBairro
        ? `${promo.motivo} · Demanda do bairro em alta`
        : promo.motivo,
      impactoEsperado: promo.impactoEsperado,
      confianca: Math.min(95, promo.confianca + (demandaBairro ? 8 : 0)),
      demandaBairro,
      jaEmPromocao: est.emPromocao,
    });
    usados.add(est.id);
    if (sugestoes.length >= limite) break;
  }

  if (sugestoes.length < limite) {
    for (const est of estoques) {
      if (usados.has(est.id)) continue;
      const fb = sugestaoFallbackEstoque({
        produtoId: est.produtoId,
        produtoNome: est.produtos.nome,
        estoqueId: est.id,
        unidadeId: est.unidadeId,
        unidadeNome: est.unidades.nome,
        preco: Number(est.preco),
        quantidade: est.quantidade,
        emPromocao: est.emPromocao,
        demandaBairro: demandaIds.has(est.produtoId),
      });
      if (fb) {
        sugestoes.push(fb);
        usados.add(est.id);
      }
      if (sugestoes.length >= limite) break;
    }
  }

  sugestoes.sort((a, b) => b.confianca - a.confianca);

  const confiancaMedia =
    sugestoes.length > 0
      ? Math.round(sugestoes.reduce((s, x) => s + x.confianca, 0) / sugestoes.length)
      : 0;

  let explicacao = engine.explicacao;
  if (sugestoes.length === 0) {
    explicacao =
      'Nenhuma promoção sugerida agora. Catálogo com giro equilibrado ou produtos já em promoção.';
  } else if (sugestoes.some((s) => s.demandaBairro)) {
    explicacao += ' Itens com demanda do bairro foram priorizados.';
  }

  return { mercadoId, sugestoes: sugestoes.slice(0, limite), explicacao, confiancaMedia };
}

export async function aprovarPromocaoAssistida(input: {
  mercadoId: string;
  estoqueId: string;
  userId: string;
  descontoPct?: number;
}): Promise<{
  ok: boolean;
  produtoNome: string;
  precoAnterior: number;
  precoPromocional: number;
  descontoPct: number;
}> {
  const estoque = await prisma.estoques.findFirst({
    where: {
      id: input.estoqueId,
      unidades: { mercadoId: input.mercadoId, ativa: true },
    },
    include: {
      produtos: { select: { nome: true } },
      unidades: { select: { mercadoId: true } },
    },
  });

  if (!estoque) {
    throw new Error('Estoque não encontrado neste mercado');
  }

  const precoAnterior = Number(estoque.preco);
  const descontoPct =
    input.descontoPct != null
      ? Math.min(40, Math.max(1, Math.round(input.descontoPct)))
      : estoque.precoPromocional
        ? Math.round((1 - Number(estoque.precoPromocional) / precoAnterior) * 100)
        : 10;

  const precoPromocional = arredondarPreco(precoAnterior * (1 - descontoPct / 100));
  if (precoPromocional >= precoAnterior) {
    throw new Error('Preço promocional deve ser menor que o preço atual');
  }

  const now = new Date();
  await prisma.estoques.update({
    where: { id: estoque.id },
    data: {
      emPromocao: true,
      precoPromocional,
      atualizadoEm: now,
      fonte: 'MANUAL_GESTOR',
      confianca: CONFIANCA.MANUAL_GESTOR,
      verificadoEm: now,
    },
  });

  await prisma.acoes_gestor.create({
    data: {
      id: `acao-promo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      mercadoId: input.mercadoId,
      userId: input.userId,
      tipo: 'promocao_aprovada',
      descricao: `Promoção ${descontoPct}% aprovada — ${estoque.produtos.nome}`,
      resultadoEsperado: {
        estoqueId: estoque.id,
        produtoId: estoque.produtoId,
        precoAnterior,
        precoPromocional,
        descontoPct,
      },
    },
  });

  notificarWebhookPrecoAlterado(
    input.mercadoId,
    [
      {
        estoqueId: estoque.id,
        produtoId: estoque.produtoId,
        unidadeId: estoque.unidadeId,
        produtoNome: estoque.produtos.nome,
        preco: precoAnterior,
        precoPromocional,
        emPromocao: true,
        precoAnterior,
      },
    ],
    'pricing_assistido'
  );

  return {
    ok: true,
    produtoNome: estoque.produtos.nome,
    precoAnterior,
    precoPromocional,
    descontoPct,
  };
}
