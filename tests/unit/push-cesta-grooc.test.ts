import { inferirHorasAteCompraProvavel } from '@/lib/cesta-provavel';
import { fontesGroocComoTexto, fonteGrooc, fontesGrooc } from '@/lib/ai/grooc-fontes';

describe('cesta-provavel — janela 48-72h', () => {
  it('estima horas até próxima compra a partir de intervalos', () => {
    const base = new Date('2026-06-01T12:00:00Z').getTime();
    const eventos = [
      { type: 'compra_confirmada', timestamp: new Date(base) },
      { type: 'compra_confirmada', timestamp: new Date(base + 7 * 86400000) },
      { type: 'compra_confirmada', timestamp: new Date(base + 14 * 86400000) },
    ];

    const r = inferirHorasAteCompraProvavel(eventos);
    expect(r.intervaloMedioDias).toBe(7);
    expect(r.confianca).toBeGreaterThan(0);
    expect(r.horasAteCompra).not.toBeNull();
  });

  it('retorna null com menos de 2 compras', () => {
    const r = inferirHorasAteCompraProvavel([
      { type: 'compra_confirmada', timestamp: new Date() },
    ]);
    expect(r.horasAteCompra).toBeNull();
    expect(r.confianca).toBe(0);
  });
});

describe('grooc-fontes', () => {
  it('formata fontes estruturadas', () => {
    const fontes = fontesGrooc(
      fonteGrooc({ tipo: 'eventos', descricao: 'Eventos agregados', periodoDias: 30 })
    );
    expect(fontesGroocComoTexto(fontes)[0]).toContain('Eventos agregados');
    expect(fontesGroocComoTexto(fontes)[0]).toContain('30d');
  });
});
