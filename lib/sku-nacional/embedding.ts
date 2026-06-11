import {
  textoProdutoParaEmbedding,
  vetorTf,
  cosineSimilarity,
  type TermVector,
} from '@/lib/scan-embedding';
import type { EmbeddingToken } from '@/lib/sku-nacional/types';

export function embeddingProdutoParaJson(input: {
  nome: string;
  marca?: string | null;
  categoria?: string | null;
}): EmbeddingToken[] {
  const texto = textoProdutoParaEmbedding(input);
  const v = vetorTf(texto);
  return [...v.entries()]
    .map(([t, w]) => ({ t, w }))
    .sort((a, b) => b.w - a.w)
    .slice(0, 48);
}

export function embeddingJsonParaVetor(tokens: EmbeddingToken[] | null | undefined): TermVector {
  const m = new Map<string, number>();
  if (!tokens?.length) return m;
  for (const { t, w } of tokens) {
    if (t && w > 0) m.set(t, w);
  }
  return m;
}

export function similaridadeEmbeddingProdutos(
  a: EmbeddingToken[] | null | undefined,
  b: EmbeddingToken[] | null | undefined
): number {
  return cosineSimilarity(embeddingJsonParaVetor(a), embeddingJsonParaVetor(b));
}
