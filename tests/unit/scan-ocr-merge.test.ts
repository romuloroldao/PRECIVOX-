import {
  mesclarCapturasOcr,
  parsePrecoManual,
  textoOcrParaCrowd,
} from '@/lib/scan-ocr-merge';

describe('scan-ocr-merge', () => {
  it('mescla item, embalagem e etiqueta com EAN e preço', () => {
    const m = mesclarCapturasOcr([
      { fonte: 'item', texto: 'Arroz Branco 5kg Tio João', eans: [] },
      { fonte: 'embalagem', texto: '7891234567890 Camil 5kg', eans: ['7891234567890'] },
      { fonte: 'etiqueta', texto: 'Arroz Branco R$ 27,90', eans: [] },
    ]);
    expect(m.eans).toContain('7891234567890');
    expect(m.textoCombinado).toContain('Arroz Branco');
    expect(m.textoCombinado).toContain('27,90');
    expect(m.precoEtiqueta).toBeCloseTo(27.9, 1);
    expect(m.porFonte.etiqueta).toContain('27,90');
  });

  it('parsePrecoManual aceita vírgula', () => {
    expect(parsePrecoManual('27,90')).toBeCloseTo(27.9);
  });

  it('textoOcrParaCrowd prioriza etiqueta e preço manual', () => {
    const m = mesclarCapturasOcr([
      { fonte: 'item', texto: 'Leite', eans: [] },
      { fonte: 'etiqueta', texto: 'Leite integral R$ 5,99', eans: [] },
    ]);
    const c = textoOcrParaCrowd(m, 5.99);
    expect(c.texto).toContain('Leite integral');
    expect(c.preco).toBeCloseTo(5.99);
  });
});
