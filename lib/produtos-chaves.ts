import {
  buildChaveProdutoParaInsights,
  normalizeNomeProdutoChave,
} from '@/lib/produtos-nome-normalize';
import { computeSkuNacionalFields } from '@/lib/sku-nacional/compute';
import type { Prisma } from '@prisma/client';

/** Campos persistidos em `produtos` para agregação SQL, SKU nacional e embedding TF. */
export function computeCamposChaveProduto(input: {
  nome: string;
  codigoBarras?: string | null;
  marca?: string | null;
  categoria?: string | null;
}): {
  nomeChave: string;
  chaveInsight: string;
  skuNacional: string;
  embeddingJson: Prisma.InputJsonValue;
} {
  const nomeChave = normalizeNomeProdutoChave(input.nome);
  const chaveInsight = buildChaveProdutoParaInsights(input);
  const sku = computeSkuNacionalFields({ ...input, chaveInsight });

  return {
    nomeChave,
    chaveInsight,
    skuNacional: sku.skuNacional,
    embeddingJson: sku.embeddingJson as Prisma.InputJsonValue,
  };
}
