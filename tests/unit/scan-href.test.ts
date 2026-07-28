import { buildScanHref } from '@/lib/cliente-mercado-ref';

describe('buildScanHref', () => {
  it('sem mercado retorna /cliente/scan', () => {
    expect(buildScanHref(null)).toBe('/cliente/scan');
    expect(buildScanHref(undefined)).toBe('/cliente/scan');
  });

  it('com mercado inclui query', () => {
    expect(buildScanHref('abc-123')).toBe('/cliente/scan?mercadoId=abc-123');
  });
});
