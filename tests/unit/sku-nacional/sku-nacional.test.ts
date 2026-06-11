import { resolveSkuNacional, hashChaveInsight, computeSkuNacionalFields } from '@/lib/sku-nacional/compute';
import { embeddingProdutoParaJson, similaridadeEmbeddingProdutos } from '@/lib/sku-nacional/embedding';

describe('sku-nacional', () => {
  it('EAN vira sku ean:', () => {
    const sku = resolveSkuNacional({
      codigoBarras: '7891234567890',
      chaveInsight: 'nome:arroz',
    });
    expect(sku).toBe('ean:7891234567890');
  });

  it('sem EAN usa hash ins:', () => {
    const insight = 'nome:leite|m:marca|c:laticinios';
    const sku = resolveSkuNacional({ chaveInsight: insight });
    expect(sku).toBe(`ins:${hashChaveInsight(insight)}`);
  });

  it('computeSkuNacionalFields gera embedding', () => {
    const f = computeSkuNacionalFields({
      nome: 'Arroz Branco 5kg',
      marca: 'Tio João',
      categoria: 'Mercearia',
    });
    expect(f.skuNacional.startsWith('ins:')).toBe(true);
    expect(f.embeddingJson.length).toBeGreaterThan(0);
  });

  it('embeddings similares para mesmo produto', () => {
    const a = embeddingProdutoParaJson({ nome: 'Leite integral', marca: 'X', categoria: 'Laticínios' });
    const b = embeddingProdutoParaJson({ nome: 'Leite Integral 1L', marca: 'X', categoria: 'Laticínios' });
    expect(similaridadeEmbeddingProdutos(a, b)).toBeGreaterThan(0.5);
  });
});
