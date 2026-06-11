import { createHash } from 'crypto';
import { buildChaveProdutoParaInsights, normalizeNomeProdutoChave } from '@/lib/produtos-nome-normalize';
import { embeddingProdutoParaJson } from '@/lib/sku-nacional/embedding';
import type { SkuNacionalCampos } from '@/lib/sku-nacional/types';

function normalizarEan(raw: string | null | undefined): string | null {
  const digits = raw?.replace(/\D/g, '') ?? '';
  if (digits.length < 8) return null;
  if (digits.length === 14 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

/** Hash estável para agrupar produtos sem EAN (nome+marca+cat). */
export function hashChaveInsight(chaveInsight: string): string {
  return createHash('sha256').update(chaveInsight.trim()).digest('hex').slice(0, 16);
}

/** SKU nacional canônico — EAN > hash do chaveInsight. */
export function resolveSkuNacional(input: {
  codigoBarras?: string | null;
  chaveInsight: string;
}): string {
  const ean = normalizarEan(input.codigoBarras);
  if (ean) return `ean:${ean}`;

  const insight = input.chaveInsight.trim();
  if (insight.startsWith('ean:')) {
    const e = normalizarEan(insight.slice(4));
    if (e) return `ean:${e}`;
  }

  return `ins:${hashChaveInsight(insight)}`;
}

export function computeSkuNacionalFields(input: {
  nome: string;
  codigoBarras?: string | null;
  marca?: string | null;
  categoria?: string | null;
  chaveInsight?: string;
}): SkuNacionalCampos {
  const chaveInsight =
    input.chaveInsight?.trim() ||
    buildChaveProdutoParaInsights({
      nome: input.nome,
      codigoBarras: input.codigoBarras,
      marca: input.marca,
      categoria: input.categoria,
    });

  return {
    skuNacional: resolveSkuNacional({
      codigoBarras: input.codigoBarras,
      chaveInsight,
    }),
    embeddingJson: embeddingProdutoParaJson({
      nome: input.nome,
      marca: input.marca,
      categoria: input.categoria,
    }),
  };
}

export function labelSkuNacional(input: { nome: string; marca?: string | null }): string {
  const n = input.nome?.trim() || 'Produto';
  const m = input.marca?.trim();
  return m ? `${n} · ${m}` : n;
}

export { normalizeNomeProdutoChave as normalizeNomeProdutoChaveSku };
