/**
 * Embedding leve (bag-of-words TF) para match de etiqueta OCR → catálogo.
 * Roda no servidor; OCR fica on-device no cliente (8.2).
 */

import { normalizeNomeProdutoChaveComSinonimos, stripDiacritics } from '@/lib/produtos-nome-normalize';

export type TermVector = Map<string, number>;

/** Tokens discriminativos para vetor de embedding. */
export function tokensParaEmbedding(texto: string): string[] {
  const chave = normalizeNomeProdutoChaveComSinonimos(texto);
  if (!chave) return [];
  return chave.split(/\s+/).filter((t) => t.length >= 2);
}

export function vetorTf(texto: string): TermVector {
  const tokens = tokensParaEmbedding(texto);
  const v = new Map<string, number>();
  for (const t of tokens) {
    v.set(t, (v.get(t) ?? 0) + 1);
  }
  return v;
}

export function cosineSimilarity(a: TermVector, b: TermVector): number {
  if (a.size === 0 || b.size === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [, va] of a) normA += va * va;
  for (const [, vb] of b) normB += vb * vb;
  const menor = a.size <= b.size ? a : b;
  const maior = a.size <= b.size ? b : a;
  for (const [term, va] of menor) {
    const vb = maior.get(term);
    if (vb != null) dot += va * vb;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function textoProdutoParaEmbedding(input: {
  nome: string;
  marca?: string | null;
  categoria?: string | null;
}): string {
  return [input.nome, input.marca, input.categoria].filter(Boolean).join(' ');
}

/** Normaliza ruído típico de OCR em etiquetas BR. */
export function limparTextoOcr(raw: string): string {
  return stripDiacritics(raw)
    .replace(/[|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
