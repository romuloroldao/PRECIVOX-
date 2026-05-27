/**
 * Scan inteligente v2 — match catálogo (EAN + embedding) + EL na etiqueta.
 */

import { prisma } from '@/lib/prisma';
import { EventCollector } from '@/lib/ai/event-collector';
import { calcularEconomiaLiquida, type ResultadoEconomiaLiquida } from '@/lib/economia-liquida';
import { buscarMelhorAlternativa } from '@/lib/melhor-alternativa-preco';
import {
  jaccardTokensDeNomes,
  normalizeNomeProdutoChaveComSinonimos,
} from '@/lib/produtos-nome-normalize';
import {
  cosineSimilarity,
  limparTextoOcr,
  textoProdutoParaEmbedding,
  vetorTf,
} from '@/lib/scan-embedding';

export const SCAN_MIN_SCORE = 0.38;
export const SCAN_MAX_CANDIDATOS = 8;

export type ScanMatchMetodo = 'ean' | 'embedding';

export type ScanMatchItem = {
  produtoId: string;
  estoqueId: string;
  nome: string;
  marca: string | null;
  categoria: string | null;
  codigoBarras: string | null;
  preco: number;
  precoPromocional: number | null;
  emPromocao: boolean;
  unidadeId: string;
  unidadeNome: string;
  mercadoId: string;
  mercadoNome: string;
  score: number;
  metodo: ScanMatchMetodo;
  explicacao: string;
  economiaLiquidaEtiqueta: ResultadoEconomiaLiquida | null;
  melhorAlternativa: Awaited<ReturnType<typeof buscarMelhorAlternativa>>;
};

export function extrairCodigosBarras(texto: string): string[] {
  const digits = texto.replace(/\D/g, ' ');
  const found = new Set<string>();
  for (const m of digits.match(/\d{8,14}/g) ?? []) {
    if (m.length === 8 || m.length === 12 || m.length === 13 || m.length === 14) {
      found.add(m.length === 14 && m.startsWith('0') ? m.slice(1) : m);
    }
  }
  for (const m of texto.match(/\b\d{13}\b/g) ?? []) found.add(m);
  for (const m of texto.match(/\b\d{8}\b/g) ?? []) found.add(m);
  return [...found];
}

/** Extrai o preço mais provável da etiqueta (R$). */
export function extrairPrecoEtiqueta(texto: string): number | null {
  const patterns = [
    /R\$\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/gi,
    /(\d{1,3}[.,]\d{2})\s*(?:reais|rs)/gi,
    /\b(\d+[.,]\d{2})\b/g,
  ];
  const valores: number[] = [];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(texto)) !== null) {
      const raw = m[1]!.replace(/\./g, '').replace(',', '.');
      const n = parseFloat(raw);
      if (Number.isFinite(n) && n > 0 && n < 50000) valores.push(n);
    }
  }
  if (valores.length === 0) return null;
  return valores.sort((a, b) => b - a)[0] ?? null;
}

export function scoreTextoVsProduto(
  query: string,
  produto: { nome: string; marca?: string | null; categoria?: string | null }
): { score: number; explicacao: string } {
  const textoProd = textoProdutoParaEmbedding(produto);
  const jaccard = jaccardTokensDeNomes(query, textoProd);
  const cos = cosineSimilarity(vetorTf(query), vetorTf(textoProd));
  const score = Math.min(1, 0.5 * jaccard + 0.5 * cos);
  const pct = Math.round(score * 100);
  return {
    score,
    explicacao:
      score >= 0.75
        ? `Alta similaridade com o catálogo (${pct}%).`
        : score >= 0.55
          ? `Provável match por nome na etiqueta (${pct}%).`
          : `Match parcial — confira o produto (${pct}%).`,
  };
}

function precoEfetivo(preco: number, promo: number | null, emPromo: boolean): number {
  if (emPromo && promo != null) return promo;
  return preco;
}

function tokensBusca(texto: string): string[] {
  return normalizeNomeProdutoChaveComSinonimos(texto)
    .split(/\s+/)
    .filter((t) => t.length >= 3)
    .slice(0, 6);
}

async function matchPorEan(
  eans: string[],
  mercadoId: string,
  precoEtiqueta: number | null
): Promise<ScanMatchItem[]> {
  const out: ScanMatchItem[] = [];
  for (const codigo of eans) {
    const produto = await prisma.produtos.findFirst({
      where: { codigoBarras: codigo, ativo: true },
      include: {
        estoques: {
          where: { disponivel: true, quantidade: { gt: 0 }, unidades: { mercadoId, ativa: true } },
          orderBy: [{ emPromocao: 'desc' }, { preco: 'asc' }],
          take: 1,
          include: {
            unidades: { include: { mercados: { select: { id: true, nome: true } } } },
          },
        },
      },
    });
    const est = produto?.estoques[0];
    if (!produto || !est) continue;

    const preco = Number(est.preco);
    const promo = est.precoPromocional != null ? Number(est.precoPromocional) : null;
    const efetivo = precoEfetivo(preco, promo, est.emPromocao);
    const melhorAlternativa = await buscarMelhorAlternativa(produto.id, est.unidadeId, efetivo);

    let economiaLiquidaEtiqueta: ResultadoEconomiaLiquida | null = null;
    if (precoEtiqueta != null && precoEtiqueta > 0) {
      economiaLiquidaEtiqueta = calcularEconomiaLiquida({
        precoOrigem: precoEtiqueta,
        precoDestino: efetivo,
      });
    }

    out.push({
      produtoId: produto.id,
      estoqueId: est.id,
      nome: produto.nome,
      marca: produto.marca,
      categoria: produto.categoria,
      codigoBarras: produto.codigoBarras,
      preco,
      precoPromocional: promo,
      emPromocao: est.emPromocao,
      unidadeId: est.unidadeId,
      unidadeNome: est.unidades.nome,
      mercadoId: est.unidades.mercados.id,
      mercadoNome: est.unidades.mercados.nome,
      score: 1,
      metodo: 'ean',
      explicacao: `Código de barras ${codigo} encontrado no catálogo.`,
      economiaLiquidaEtiqueta,
      melhorAlternativa,
    });
  }
  return out;
}

async function candidatosPorTexto(mercadoId: string, texto: string) {
  const tokens = tokensBusca(texto);
  const whereNome =
    tokens.length > 0
      ? {
          OR: tokens.map((t) => ({
            nome: { contains: t, mode: 'insensitive' as const },
          })),
        }
      : {};

  return prisma.produtos.findMany({
    where: {
      ativo: true,
      ...whereNome,
      estoques: {
        some: {
          disponivel: true,
          quantidade: { gt: 0 },
          unidades: { mercadoId, ativa: true },
        },
      },
    },
    take: 180,
    orderBy: { dataAtualizacao: 'desc' },
    select: {
      id: true,
      nome: true,
      marca: true,
      categoria: true,
      codigoBarras: true,
      estoques: {
        where: {
          disponivel: true,
          quantidade: { gt: 0 },
          unidades: { mercadoId, ativa: true },
        },
        orderBy: [{ emPromocao: 'desc' }, { preco: 'asc' }],
        take: 1,
        select: {
          id: true,
          preco: true,
          precoPromocional: true,
          emPromocao: true,
          unidadeId: true,
          unidades: {
            select: {
              nome: true,
              mercadoId: true,
              mercados: { select: { id: true, nome: true } },
            },
          },
        },
      },
    },
  });
}

async function matchPorEmbedding(
  texto: string,
  mercadoId: string,
  precoEtiqueta: number | null
): Promise<ScanMatchItem[]> {
  const query = limparTextoOcr(texto);
  if (query.length < 3) return [];

  const produtos = await candidatosPorTexto(mercadoId, query);
  const ranked: ScanMatchItem[] = [];

  for (const p of produtos) {
    const est = p.estoques[0];
    if (!est) continue;
    const { score, explicacao } = scoreTextoVsProduto(query, p);
    if (score < SCAN_MIN_SCORE) continue;

    const preco = Number(est.preco);
    const promo = est.precoPromocional != null ? Number(est.precoPromocional) : null;
    const efetivo = precoEfetivo(preco, promo, est.emPromocao);
    const melhorAlternativa = await buscarMelhorAlternativa(p.id, est.unidadeId, efetivo);

    let economiaLiquidaEtiqueta: ResultadoEconomiaLiquida | null = null;
    if (precoEtiqueta != null && precoEtiqueta > 0) {
      economiaLiquidaEtiqueta = calcularEconomiaLiquida({
        precoOrigem: precoEtiqueta,
        precoDestino: efetivo,
      });
    }

    ranked.push({
      produtoId: p.id,
      estoqueId: est.id,
      nome: p.nome,
      marca: p.marca,
      categoria: p.categoria,
      codigoBarras: p.codigoBarras,
      preco,
      precoPromocional: promo,
      emPromocao: est.emPromocao,
      unidadeId: est.unidadeId,
      unidadeNome: est.unidades.nome,
      mercadoId: est.unidades.mercados.id,
      mercadoNome: est.unidades.mercados.nome,
      score,
      metodo: 'embedding',
      explicacao,
      economiaLiquidaEtiqueta,
      melhorAlternativa,
    });
  }

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, SCAN_MAX_CANDIDATOS);
}

export async function buscarMatchesScan(input: {
  textoOcr: string;
  mercadoId: string;
  precoEtiqueta?: number | null;
  userId?: string;
}): Promise<{
  textoLimpo: string;
  precoDetectado: number | null;
  eansDetectados: string[];
  matches: ScanMatchItem[];
}> {
  const textoLimpo = limparTextoOcr(input.textoOcr);
  const precoDetectado =
    input.precoEtiqueta != null && input.precoEtiqueta > 0
      ? input.precoEtiqueta
      : extrairPrecoEtiqueta(input.textoOcr);
  const eansDetectados = extrairCodigosBarras(textoLimpo);

  let matches: ScanMatchItem[] = [];
  if (eansDetectados.length > 0) {
    matches = await matchPorEan(eansDetectados, input.mercadoId, precoDetectado);
  }
  if (matches.length === 0) {
    matches = await matchPorEmbedding(textoLimpo, input.mercadoId, precoDetectado);
  } else {
    matches = matches.slice(0, SCAN_MAX_CANDIDATOS);
  }

  if (input.userId && matches[0]) {
    const top = matches[0];
    void EventCollector.recordEvent(input.userId, input.mercadoId, 'produto_visualizado', {
      produtoId: top.produtoId,
      searchQuery: textoLimpo.slice(0, 200),
      origem: 'scan_inteligente_v2',
      metodo: top.metodo,
      score: top.score,
      precoEtiqueta: precoDetectado ?? undefined,
    }).catch(() => {});
  }

  return { textoLimpo, precoDetectado, eansDetectados, matches };
}
