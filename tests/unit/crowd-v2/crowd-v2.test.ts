import { PESO_NIVEL_CROWD, pesoNivelCrowd } from '@/lib/crowd-reputacao-peso';
import { extrairPrecoEtiqueta } from '@/lib/scan-ocr-parse';

describe('crowd-v2 / peso reputação', () => {
  it('embaixador pesa 2× observador', () => {
    expect(pesoNivelCrowd('embaixador')).toBe(2);
    expect(pesoNivelCrowd('observador')).toBe(1);
    expect(PESO_NIVEL_CROWD.guardiao).toBe(1.5);
  });
});

describe('crowd-v2 / OCR etiqueta', () => {
  it('extrai preço R$ da etiqueta', () => {
    expect(extrairPrecoEtiqueta('ARROZ T1 5KG R$ 24,90')).toBeCloseTo(24.9, 1);
  });
});
