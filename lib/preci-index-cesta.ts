/**
 * PRECI Index — cesta-referência do bairro (Épico 11.4)
 * Índice hiperlocal de preços de itens essenciais agregados por região (CEP/cidade/raio).
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import {
  parseRegiaoPrecoParam,
  resolveRegiaoPrecoParaMercado,
  type RegiaoPrecoRef,
  type RegiaoPrecoResolvido,
} from '@/lib/ai/conversao-metrics';
import { resolverUnidadesReferenciaPreco } from '@/lib/regiao-preco-unidades';

export type ItemCestaPreci = {
  slug: string;
  label: string;
  categoria: string;
  termos: string[];
};

/** Cesta-referência nacional simplificada (10 itens essenciais). */
export const CESTA_PRECI_BAIRRO: ItemCestaPreci[] = [
  { slug: 'arroz', label: 'Arroz', categoria: 'Mercearia', termos: ['arroz'] },
  { slug: 'feijao', label: 'Feijão', categoria: 'Mercearia', termos: ['feijao'] },
  { slug: 'oleo', label: 'Óleo de soja', categoria: 'Mercearia', termos: ['oleo', 'soja'] },
  { slug: 'macarrao', label: 'Massas', categoria: 'Mercearia', termos: ['macarrao', 'espaguete', 'massa'] },
  { slug: 'acucar', label: 'Açúcar', categoria: 'Mercearia', termos: ['acucar'] },
  { slug: 'cafe', label: 'Café', categoria: 'Mercearia', termos: ['cafe'] },
  { slug: 'leite', label: 'Leite', categoria: 'Laticínios', termos: ['leite'] },
  { slug: 'frango', label: 'Frango', categoria: 'Açougue', termos: ['frango'] },
  { slug: 'pao', label: 'Pão', categoria: 'Padaria', termos: ['pao', 'frances'] },
  { slug: 'agua', label: 'Água mineral', categoria: 'Bebidas', termos: ['agua', 'mineral'] },
];

export type ItemPreciIndex = {
  slug: string;
  label: string;
  precoRegional: number | null;
  precoMercado: number | null;
  diferencaPct: number | null;
  amostraRegional: number;
  chaveInsight: string | null;
};

export type PreciIndexResult = {
  mercadoId: string | null;
  regiao: RegiaoPrecoResolvido & { raioKm: number; label: string };
  indiceValor: number | null;
  variacaoPct: number | null;
  valorCestaRegional: number;
  valorCestaMercado: number | null;
  posicaoMercadoPct: number | null;
  itens: ItemPreciIndex[];
  cobertura: { encontrados: number; total: number; pct: number };
  explicacao: string;
  periodoComparacaoDias: number;
};

function precoEfetivo(preco: number, promocional: number | null, emPromocao: boolean): number {
  if (emPromocao && promocional != null && promocional > 0) return promocional;
  return preco;
}

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function produtoCombina(nomeChave: string | null | undefined, nome: string, termos: string[]): boolean {
  const base = normalizar(`${nomeChave ?? ''} ${nome}`);
  return termos.some((t) => base.includes(normalizar(t)));
}

async function unidadesWhereRegiao(
  mercadoId: string | null,
  ctx: RegiaoPrecoResolvido,
  raioKm: number,
  incluirProprioMercado: boolean
): Promise<Prisma.estoquesWhereInput['unidades'] | null> {
  const ctxGeo = { efetivo: ctx.efetivo, estado: ctx.estado, cidade: ctx.cidade };
  let ref = mercadoId
    ? await resolverUnidadesReferenciaPreco(mercadoId, ctxGeo, raioKm)
    : null;

  if (!ref && ctx.efetivo === 'proximidade' && mercadoId) {
    const sub = ctx.estado && ctx.cidade ? 'cidade' : 'ampla';
    ref = await resolverUnidadesReferenciaPreco(
      mercadoId,
      { efetivo: sub, estado: ctx.estado, cidade: ctx.cidade },
      raioKm
    );
  }

  if (ref?.tipo === 'ids') {
    return { id: { in: ref.ids } };
  }

  if (ref?.tipo === 'prisma_unidades') {
    if (incluirProprioMercado || !mercadoId) {
      return ref.where;
    }
    return { ...ref.where, mercadoId: { not: mercadoId } };
  }

  if (!mercadoId && ctx.estado) {
    if (ctx.efetivo === 'cidade' && ctx.cidade) {
      return { estado: ctx.estado, cidade: ctx.cidade };
    }
    return { estado: ctx.estado };
  }

  return null;
}

type EstoqueLinha = {
  preco: number;
  precoPromocional: number | null;
  emPromocao: boolean;
  produtoId: string;
  chaveInsight: string | null;
  nomeChave: string | null;
  nome: string;
  categoria: string | null;
  mercadoId: string;
};

async function carregarEstoquesRegiao(
  unidadesWhere: Prisma.estoquesWhereInput['unidades'],
  categorias: string[]
): Promise<EstoqueLinha[]> {
  const rows = await prisma.estoques.findMany({
    where: {
      disponivel: true,
      quantidade: { gt: 0 },
      unidades: unidadesWhere,
      produtos: { categoria: { in: categorias }, ativo: true },
    },
    select: {
      preco: true,
      precoPromocional: true,
      emPromocao: true,
      produtos: {
        select: {
          id: true,
          nome: true,
          categoria: true,
          chaveInsight: true,
          nomeChave: true,
        },
      },
      unidades: { select: { mercadoId: true } },
    },
    take: 800,
  });

  return rows.map((r) => ({
    preco: r.preco.toNumber(),
    precoPromocional: r.precoPromocional?.toNumber() ?? null,
    emPromocao: r.emPromocao,
    produtoId: r.produtos.id,
    chaveInsight: r.produtos.chaveInsight,
    nomeChave: r.produtos.nomeChave,
    nome: r.produtos.nome,
    categoria: r.produtos.categoria,
    mercadoId: r.unidades.mercadoId,
  }));
}

function resolverItem(
  item: ItemCestaPreci,
  linhas: EstoqueLinha[],
  mercadoIdFiltro?: string
): { preco: number; amostra: number; chaveInsight: string | null } | null {
  const candidatos = linhas.filter((l) => {
    if (l.categoria !== item.categoria) return false;
    if (mercadoIdFiltro && l.mercadoId !== mercadoIdFiltro) return false;
    return produtoCombina(l.nomeChave, l.nome, item.termos);
  });

  if (candidatos.length === 0) return null;

  const porChave = new Map<string, number>();
  for (const c of candidatos) {
    const p = precoEfetivo(c.preco, c.precoPromocional, c.emPromocao);
    const chave = c.chaveInsight ?? c.produtoId;
    const atual = porChave.get(chave);
    if (atual == null || p < atual) porChave.set(chave, p);
  }

  const precos = [...porChave.values()];
  const min = Math.min(...precos);
  const chaveInsight =
    candidatos.find((c) => {
      const p = precoEfetivo(c.preco, c.precoPromocional, c.emPromocao);
      return p === min;
    })?.chaveInsight ?? null;

  return { preco: min, amostra: porChave.size, chaveInsight };
}

async function variacaoHistoricaRegional(
  produtoIds: string[],
  unidadesWhere: Prisma.estoquesWhereInput['unidades'],
  dias = 30
): Promise<number | null> {
  if (produtoIds.length === 0) return null;

  const fimRecente = new Date();
  const inicioRecente = new Date();
  inicioRecente.setDate(inicioRecente.getDate() - 7);

  const fimAnterior = new Date(inicioRecente);
  const inicioAnterior = new Date();
  inicioAnterior.setDate(inicioAnterior.getDate() - dias);

  const [recente, anterior] = await Promise.all([
    prisma.vendas.aggregate({
      where: {
        produtoId: { in: produtoIds },
        dataVenda: { gte: inicioRecente, lte: fimRecente },
        unidades: unidadesWhere,
      },
      _avg: { precoUnitario: true },
      _count: true,
    }),
    prisma.vendas.aggregate({
      where: {
        produtoId: { in: produtoIds },
        dataVenda: { gte: inicioAnterior, lt: inicioRecente },
        unidades: unidadesWhere,
      },
      _avg: { precoUnitario: true },
      _count: true,
    }),
  ]);

  const avgRecente = recente._avg.precoUnitario?.toNumber();
  const avgAnterior = anterior._avg.precoUnitario?.toNumber();

  if (
    avgRecente == null ||
    avgAnterior == null ||
    avgAnterior <= 0 ||
    (recente._count ?? 0) < 3 ||
    (anterior._count ?? 0) < 3
  ) {
    return null;
  }

  return Math.round(((avgRecente - avgAnterior) / avgAnterior) * 1000) / 10;
}

function labelRegiao(ctx: RegiaoPrecoResolvido, raioKm: number): string {
  if (ctx.efetivo === 'proximidade') return `raio ${raioKm} km`;
  if (ctx.efetivo === 'cidade' && ctx.cidade) return ctx.cidade;
  if (ctx.estado) return `UF ${ctx.estado}`;
  return 'região';
}

export { parseRegiaoPrecoParam };

export async function calcularPreciIndexCesta(
  mercadoId: string | null,
  regiaoPreco: RegiaoPrecoRef = 'cidade',
  raioKm = 25
): Promise<PreciIndexResult> {
  const ctx = mercadoId
    ? await resolveRegiaoPrecoParaMercado(mercadoId, regiaoPreco)
    : {
        pedido: regiaoPreco,
        efetivo: regiaoPreco === 'proximidade' ? ('proximidade' as const) : ('ampla' as const),
        fallbackDeCidadeParaAmpla: false,
        estado: null,
        cidade: null,
      };

  const unidadesRegiao = await unidadesWhereRegiao(mercadoId, ctx, raioKm, true);
  const categorias = [...new Set(CESTA_PRECI_BAIRRO.map((i) => i.categoria))];

  if (!unidadesRegiao) {
    return {
      mercadoId,
      regiao: { ...ctx, raioKm, label: labelRegiao(ctx, raioKm) },
      indiceValor: null,
      variacaoPct: null,
      valorCestaRegional: 0,
      valorCestaMercado: null,
      posicaoMercadoPct: null,
      itens: CESTA_PRECI_BAIRRO.map((item) => ({
        slug: item.slug,
        label: item.label,
        precoRegional: null,
        precoMercado: null,
        diferencaPct: null,
        amostraRegional: 0,
        chaveInsight: null,
      })),
      cobertura: { encontrados: 0, total: CESTA_PRECI_BAIRRO.length, pct: 0 },
      explicacao:
        'PRECI Index indisponível: cadastre cidade/UF da unidade ou aguarde mais lojas na região.',
      periodoComparacaoDias: 30,
    };
  }

  const linhasRegiao = await carregarEstoquesRegiao(unidadesRegiao, categorias);
  const linhasMercado = mercadoId
    ? linhasRegiao.filter((l) => l.mercadoId === mercadoId)
    : [];

  const itens: ItemPreciIndex[] = [];
  let valorRegional = 0;
  let valorMercado = 0;
  let itensMercado = 0;
  const produtoIdsHistorico: string[] = [];

  for (const item of CESTA_PRECI_BAIRRO) {
    const reg = resolverItem(item, linhasRegiao);
    const merc = mercadoId ? resolverItem(item, linhasMercado, mercadoId) : null;

    if (reg) {
      valorRegional += reg.preco;
      const idsMatch = linhasRegiao
        .filter(
          (l) =>
            l.categoria === item.categoria &&
            produtoCombina(l.nomeChave, l.nome, item.termos)
        )
        .map((l) => l.produtoId);
      produtoIdsHistorico.push(...idsMatch.slice(0, 5));
    }
    if (merc) {
      valorMercado += merc.preco;
      itensMercado++;
    }

    let diferencaPct: number | null = null;
    if (reg && merc && reg.preco > 0) {
      diferencaPct = Math.round(((merc.preco - reg.preco) / reg.preco) * 1000) / 10;
    }

    itens.push({
      slug: item.slug,
      label: item.label,
      precoRegional: reg?.preco ?? null,
      precoMercado: merc?.preco ?? null,
      diferencaPct,
      amostraRegional: reg?.amostra ?? 0,
      chaveInsight: reg?.chaveInsight ?? null,
    });
  }

  const encontrados = itens.filter((i) => i.precoRegional != null).length;
  const coberturaPct = Math.round((encontrados / CESTA_PRECI_BAIRRO.length) * 100);

  let variacaoPct = await variacaoHistoricaRegional(
    [...new Set(produtoIdsHistorico)],
    unidadesRegiao,
    30
  );

  const indiceValor =
    variacaoPct != null ? Math.round((100 + variacaoPct) * 10) / 10 : null;

  let posicaoMercadoPct: number | null = null;
  if (mercadoId && valorRegional > 0 && itensMercado >= 4) {
    posicaoMercadoPct = Math.round(((valorMercado - valorRegional) / valorRegional) * 1000) / 10;
  }

  const regLabel = labelRegiao(ctx, raioKm);
  let explicacao = `PRECI Index agrega o menor preço disponível de ${encontrados} itens essenciais em ${regLabel}. Base 100 = estável; acima de 100 = cesta mais cara que o período anterior.`;
  if (posicaoMercadoPct != null) {
    if (posicaoMercadoPct > 5) {
      explicacao += ` Sua loja está ${posicaoMercadoPct.toFixed(1)}% acima do melhor preço agregado do bairro.`;
    } else if (posicaoMercadoPct < -3) {
      explicacao += ` Sua loja está ${Math.abs(posicaoMercadoPct).toFixed(1)}% abaixo da referência — posição competitiva.`;
    } else {
      explicacao += ` Sua cesta-referência está alinhada ao bairro (${posicaoMercadoPct > 0 ? '+' : ''}${posicaoMercadoPct.toFixed(1)}%).`;
    }
  }

  return {
    mercadoId,
    regiao: { ...ctx, raioKm, label: regLabel },
    indiceValor,
    variacaoPct,
    valorCestaRegional: Math.round(valorRegional * 100) / 100,
    valorCestaMercado: itensMercado > 0 ? Math.round(valorMercado * 100) / 100 : null,
    posicaoMercadoPct,
    itens,
    cobertura: { encontrados, total: CESTA_PRECI_BAIRRO.length, pct: coberturaPct },
    explicacao,
    periodoComparacaoDias: 30,
  };
}
