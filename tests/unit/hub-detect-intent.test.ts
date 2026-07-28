/**
 * Hub PRECI — detecção de intent (Fase 4).
 */

import { buildStructuredResponse, detectHubIntent, extractAddItems } from '@/lib/hub/detect-intent';

describe('extractAddItems', () => {
  it('extrai produto e quantidade', () => {
    expect(extractAddItems('Adiciona 2 leite')).toEqual({ query: 'leite', qty: 2 });
    expect(extractAddItems('coloca arroz')).toEqual({ query: 'arroz', qty: 1 });
  });
});

describe('detectHubIntent', () => {
  it('detecta add_items', () => {
    const d = detectHubIntent('Adiciona leite');
    expect(d.intent).toBe('add_items');
    expect(d.confidence).toBeGreaterThanOrEqual(0.9);
    expect((d.slots.items as { query: string }[])[0].query).toBe('leite');
  });

  it('detecta build_weekly', () => {
    expect(detectHubIntent('Monte a compra da semana').intent).toBe('build_weekly');
  });

  it('detecta price_query', () => {
    const d = detectHubIntent('Quanto custa arroz no Mercado do João?');
    expect(d.intent).toBe('price_query');
    expect(d.slots.produto).toMatch(/arroz/i);
  });

  it('detecta repeat_last', () => {
    expect(detectHubIntent('Repete minha compra passada').intent).toBe('repeat_last');
  });

  it('detecta scan', () => {
    expect(detectHubIntent('Escanear etiqueta').intent).toBe('scan');
  });

  it('detecta EAN puro como scan (foto/OCR)', () => {
    const d = detectHubIntent('7891234567890');
    expect(d.intent).toBe('scan');
    expect(d.slots.ean).toBe('7891234567890');
  });

  it('respeita intentHint de chip', () => {
    const d = detectHubIntent('', {}, 'start_instore');
    expect(d.intent).toBe('start_instore');
    expect(d.confidence).toBe(1);
  });
});

describe('buildStructuredResponse', () => {
  it('sempre tem explanation e ui.type', () => {
    const intents = [
      'Adiciona leite',
      'Monte a compra da semana',
      'Quanto custa café',
      'Repete minha compra passada',
      'Escanear',
    ];
    for (const phrase of intents) {
      const r = buildStructuredResponse(detectHubIntent(phrase));
      expect(r.explanation.trim().length).toBeGreaterThan(0);
      expect(r.ui.type).toBeTruthy();
      expect(r.explanation.toLowerCase()).not.toContain('a ia recomenda');
    }
  });

  it('add_items aponta para busca com q', () => {
    const r = buildStructuredResponse(detectHubIntent('Adiciona leite'));
    expect(r.ui.type).toBe('search_results');
    expect(r.ui.href).toContain('/cliente/busca?q=leite');
  });

  it('build_weekly aponta para compra montar', () => {
    const r = buildStructuredResponse(detectHubIntent('compra da semana'));
    expect(r.ui.type).toBe('rascunho_compra');
    expect(r.ui.href).toContain('/cliente/compra?montar=1');
  });
});
