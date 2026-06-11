/** Vetor TF esparso serializado em JSON (sem dependência de Prisma no client). */
export type EmbeddingToken = { t: string; w: number };

export type SkuNacionalCampos = {
  skuNacional: string;
  embeddingJson: EmbeddingToken[];
};

export type OfertaSkuNacional = {
  mercadoId: string;
  mercadoNome: string;
  produtoId: string;
  estoqueId: string;
  nome: string;
  precoEfetivo: number;
  emPromocao: boolean;
};

export type ResumoSkuNacional = {
  skuNacional: string;
  label: string;
  mercados: number;
  ofertas: OfertaSkuNacional[];
  precoMin: number | null;
  precoMax: number | null;
};
