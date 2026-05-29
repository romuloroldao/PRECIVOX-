/**
 * Benchmark preço regional — compara catálogo do mercado vs referência agregada (Épico 10.4)
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import {
  parseRegiaoPrecoParam,
  resolveRegiaoPrecoParaMercado,
  type RegiaoPrecoRef,
  type RegiaoPrecoResolvido,
} from '@/lib/ai/conversao-metrics';
import { resolverUnidadesReferenciaPreco, toCtxRegiaoPreco } from '@/lib/regiao-preco-unidades';

export type BenchmarkPosicao = 'ACIMA' | 'ABAIXO' | 'ALINHADO';

export type BenchmarkPrecoItem = {
  id: string;
  produtoId: string;
  produtoNome: string;
  estoqueId: string;
  categoria: string | null;
  precoAtual: number;
  precoMedioRegional: number;
  diferencaPct: number;
  posicao: BenchmarkPosicao;
  amostraRegional: number;
  recomendacao: string;
};

export type BenchmarkPrecoResumo = {
  mercadoId: string;
  regiao: RegiaoPrecoResolvido & { raioKm: number };
  itens: BenchmarkPrecoItem[];
  resumo: {
    totalAnalisados: number;
    acimaMercado: number;
    abaixoMercado: number;
    alinhados: number;
    gapMedioPct: number;
  };
  explicacao: string;
};

function precoEfetivo(preco: number, promocional: number | null, emPromocao: boolean): number {
  if (emPromocao && promocional != null && promocional > 0) return promocional;
  return preco;
}

function posicaoDeGap(pct: number): BenchmarkPosicao {
  if (pct > 3) return 'ACIMA';
  if (pct < -3) return 'ABAIXO';
  return 'ALINHADO';
}

function recomendacaoDeGap(pct: number, precoAtual: number, media: number): string {
  if (pct > 10) {
    return `Preço ${pct.toFixed(1)}% acima da referência (R$ ${media.toFixed(2)}). Revisar margem ou destacar diferencial — risco de perder intenção na lista.`;
  }
  if (pct > 3) {
    return `Levemente acima da referência regional. Pequeno ajuste ou promoção pontual pode melhorar conversão no app.`;
  }
  if (pct < -10) {
    return `Preço agressivo (${Math.abs(pct).toFixed(1)}% abaixo da referência). Boa para atrair listas — confira margem.`;
  }
  if (pct < -3) {
    return `Abaixo da referência regional — posição competitiva no bairro.`;
  }
  return `Alinhado à referência regional (R$ ${media.toFixed(2)} vs seu R$ ${precoAtual.toFixed(2)}).`;
}

async function unidadesRefExcluindoMercado(
  mercadoId: string,
  ctx: RegiaoPrecoResolvido,
  raioKm: number
): Promise<Prisma.estoquesWhereInput['unidades'] | null> {
  const ctxGeo = toCtxRegiaoPreco(ctx);
  let ref = await resolverUnidadesReferenciaPreco(mercadoId, ctxGeo, raioKm);

  if (!ref && (ctx.efetivo === 'proximidade' || ctx.efetivo === 'poligono' || ctx.efetivo === 'cep5')) {
    const sub =
      ctx.estado && ctx.cidade ? ('cidade' as const) : ('ampla' as const);
    ref = await resolverUnidadesReferenciaPreco(
      mercadoId,
      { efetivo: sub, estado: ctx.estado, cidade: ctx.cidade, cep5: ctx.cep5, bairro: ctx.bairro },
      raioKm
    );
  }

  if (!ref) return null;

  if (ref.tipo === 'ids') {
    const unidadesMercado = await prisma.unidades.findMany({
      where: { mercadoId },
      select: { id: true },
    });
    const proprios = new Set(unidadesMercado.map((u) => u.id));
    const filtrados = ref.ids.filter((id) => !proprios.has(id));
    if (filtrados.length === 0) return null;
    return { id: { in: filtrados } };
  }

  return {
    ...ref.where,
    mercadoId: { not: mercadoId },
  };
}

type ChaveRef = { tipo: 'insight'; valor: string } | { tipo: 'categoria'; valor: string };

export async function getBenchmarkPrecoRegional(
  mercadoId: string,
  regiaoPreco: RegiaoPrecoRef = 'cidade',
  raioKm = 25,
  limite = 12
): Promise<BenchmarkPrecoResumo> {
  const ctx = await resolveRegiaoPrecoParaMercado(mercadoId, regiaoPreco);
  const unidadesRef = await unidadesRefExcluindoMercado(mercadoId, ctx, raioKm);

  const estoquesMercado = await prisma.estoques.findMany({
    where: {
      unidades: { mercadoId },
      disponivel: true,
      quantidade: { gt: 0 },
    },
    select: {
      id: true,
      preco: true,
      precoPromocional: true,
      emPromocao: true,
      quantidade: true,
      produtos: {
        select: {
          id: true,
          nome: true,
          categoria: true,
          chaveInsight: true,
        },
      },
    },
    orderBy: { quantidade: 'desc' },
    take: 120,
  });

  if (!unidadesRef || estoquesMercado.length === 0) {
    return {
      mercadoId,
      regiao: { ...ctx, raioKm },
      itens: [],
      resumo: {
        totalAnalisados: 0,
        acimaMercado: 0,
        abaixoMercado: 0,
        alinhados: 0,
        gapMedioPct: 0,
      },
      explicacao:
        'Benchmark indisponível: cadastre cidade/UF da unidade ou aguarde mais dados regionais agregados.',
    };
  }

  const cacheRegional = new Map<string, { media: number; amostra: number }>();

  async function mediaRegional(chave: ChaveRef): Promise<{ media: number; amostra: number } | null> {
    const key = `${chave.tipo}:${chave.valor}`;
    if (cacheRegional.has(key)) return cacheRegional.get(key)!;

    const produtoWhere: Prisma.produtosWhereInput =
      chave.tipo === 'insight' ? { chaveInsight: chave.valor } : { categoria: chave.valor };

    const [agg, amostra] = await Promise.all([
      prisma.estoques.aggregate({
        where: { produtos: produtoWhere, unidades: unidadesRef },
        _avg: { preco: true },
      }),
      prisma.estoques.count({
        where: { produtos: produtoWhere, unidades: unidadesRef, quantidade: { gt: 0 } },
      }),
    ]);

    const avg = agg._avg.preco ? Number(agg._avg.preco) : null;
    if (!avg || avg <= 0 || amostra < 2) return null;

    const entry = { media: Math.round(avg * 100) / 100, amostra };
    cacheRegional.set(key, entry);
    return entry;
  }

  const candidatos: BenchmarkPrecoItem[] = [];

  for (const e of estoquesMercado) {
    const p = e.produtos;
    const chave: ChaveRef | null = p.chaveInsight
      ? { tipo: 'insight', valor: p.chaveInsight }
      : p.categoria
        ? { tipo: 'categoria', valor: p.categoria }
        : null;

    if (!chave) continue;

    const precoAtual = precoEfetivo(
      Number(e.preco),
      e.precoPromocional ? Number(e.precoPromocional) : null,
      e.emPromocao
    );

    const ref = await mediaRegional(chave);
    if (!ref) continue;

    const diferencaPct = Math.round(((precoAtual - ref.media) / ref.media) * 1000) / 10;
    const posicao = posicaoDeGap(diferencaPct);

    candidatos.push({
      id: `bench-${e.id}`,
      produtoId: p.id,
      produtoNome: p.nome ?? 'Produto',
      estoqueId: e.id,
      categoria: p.categoria,
      precoAtual,
      precoMedioRegional: ref.media,
      diferencaPct,
      posicao,
      amostraRegional: ref.amostra,
      recomendacao: recomendacaoDeGap(diferencaPct, precoAtual, ref.media),
    });
  }

  candidatos.sort((a, b) => Math.abs(b.diferencaPct) - Math.abs(a.diferencaPct));

  const comGap = candidatos.filter((c) => c.posicao !== 'ALINHADO');
  const itens = (comGap.length > 0 ? comGap : candidatos).slice(0, limite);

  const analisados = candidatos;
  const acima = analisados.filter((c) => c.posicao === 'ACIMA').length;
  const abaixo = analisados.filter((c) => c.posicao === 'ABAIXO').length;
  const alinhados = analisados.filter((c) => c.posicao === 'ALINHADO').length;
  const gapMedio =
    analisados.length > 0
      ? Math.round(
          (analisados.reduce((s, c) => s + Math.abs(c.diferencaPct), 0) / analisados.length) * 10
        ) / 10
      : 0;

  let explicacao =
    'Referência agregada e anônima na região (exclui seu próprio catálogo). Comparação por produto lógico (EAN/chave) ou categoria.';
  if (ctx.fallbackDeCidadeParaAmpla) {
    explicacao +=
      ' Cadastre a cidade da unidade para aproximar o benchmark do entorno físico.';
  } else if (ctx.fallbackDePoligonoParaCep5) {
    explicacao += ' Polígono do bairro indisponível — usando agregação por CEP5.';
  } else if (ctx.fallbackDeCep5ParaCidade) {
    explicacao += ' CEP5 sem unidades — usando agregação por cidade/UF.';
  } else if (ctx.efetivo === 'cep5' && ctx.cep5) {
    explicacao += ` Escopo: CEP ${ctx.cep5}${ctx.bairro ? ` (${ctx.bairro})` : ''}.`;
  } else if (ctx.efetivo === 'poligono') {
    explicacao += ` Escopo: polígono do bairro${ctx.bairro ? ` (${ctx.bairro})` : ''}.`;
  } else if (ctx.efetivo === 'proximidade') {
    explicacao += ` Raio de ~${raioKm} km a partir da unidade geocodificada.`;
  } else if (ctx.efetivo === 'cidade') {
    explicacao += ' Escopo: mesma cidade do cadastro.';
  } else {
    explicacao += ' Escopo: visão ampliada (UF).';
  }

  return {
    mercadoId,
    regiao: { ...ctx, raioKm },
    itens,
    resumo: {
      totalAnalisados: analisados.length,
      acimaMercado: acima,
      abaixoMercado: abaixo,
      alinhados,
      gapMedioPct: gapMedio,
    },
    explicacao,
  };
}

export { parseRegiaoPrecoParam };
