/**
 * Ranking híbrido na busca (2.4): preço + confiança truth + eixos PRECI.
 */

import type { PerfilPreciScores } from '@/lib/perfil-preci';

export type ItemRankingHibrido = {
  preco?: number;
  precoEfetivo?: number;
  emPromocao?: boolean;
  disponivel?: boolean;
  truth?: { confianca?: number } | null;
};

const CAP_RANKING = 400;

export function scoreRankingHibrido(
  item: ItemRankingHibrido,
  scores: PerfilPreciScores | null
): number {
  const preco = Math.max(0.01, item.precoEfetivo ?? item.preco ?? 999);
  const confianca = item.truth?.confianca ?? 70;

  const economia = Math.max(0, 100 - Math.log10(preco) * 28);
  const truth = confianca * 0.35;
  const promo = item.emPromocao ? 10 : 0;
  const estoque = item.disponivel !== false ? 4 : 0;

  let preci = 0;
  if (scores) {
    preci += (scores.planejador / 100) * (confianca / 100) * 12;
    preci += (scores.urgente / 100) * economia * 0.12;
    preci += (scores.conveniencia / 100) * estoque;
    preci += (scores.marca / 100) * (item.emPromocao ? 0 : 3);
  }

  return economia * 0.42 + truth + promo + estoque + preci;
}

export function ordenarPorRankingHibrido<T extends ItemRankingHibrido>(
  itens: T[],
  scores: PerfilPreciScores | null
): T[] {
  return [...itens].sort((a, b) => {
    const diff = scoreRankingHibrido(b, scores) - scoreRankingHibrido(a, scores);
    if (Math.abs(diff) > 0.001) return diff;
    const pa = a.precoEfetivo ?? a.preco ?? 0;
    const pb = b.precoEfetivo ?? b.preco ?? 0;
    return pa - pb;
  });
}

export function paginarRankingHibrido<T>(itens: T[], page: number, limit: number): T[] {
  const skip = (page - 1) * limit;
  return itens.slice(skip, skip + limit);
}

export { CAP_RANKING };
