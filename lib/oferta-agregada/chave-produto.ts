import { computeCamposChaveProduto } from '@/lib/produtos-chaves';

export type ProdutoChaveInput = {
  id: string;
  nome: string;
  codigoBarras?: string | null;
  marca?: string | null;
  categoria?: string | null;
  chaveInsight?: string | null;
  nomeChave?: string | null;
  skuNacional?: string | null;
};

/** Chave lógica para agregar demanda entre mercados (skuNacional > EAN > chaveInsight). */
export function chaveLogicaProduto(p: ProdutoChaveInput): string {
  if (p.skuNacional?.trim()) return p.skuNacional.trim();

  const ean = p.codigoBarras?.replace(/\D/g, '');
  if (ean && ean.length >= 8) return `ean:${ean}`;

  if (p.chaveInsight?.trim()) return `insight:${p.chaveInsight.trim()}`;

  const computed = computeCamposChaveProduto({
    nome: p.nome,
    codigoBarras: p.codigoBarras,
    marca: p.marca,
    categoria: p.categoria,
  });
  return computed.skuNacional || `insight:${computed.chaveInsight}`;
}

export function labelProdutoLogico(p: ProdutoChaveInput): string {
  return p.nome?.trim() || 'Produto';
}
