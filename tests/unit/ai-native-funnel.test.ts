/**
 * Funil AI-Native — testes unitários (Fase 9).
 */

import {
  funnelMeetsOrBeatsBaseline,
  summarizeAiNativeFunnel,
} from '@/lib/ai-native-funnel';
import type { UserEvent } from '@/lib/ai/types';

function ev(type: UserEvent['type'], i: number): UserEvent {
  return {
    id: String(i),
    userId: 'u1',
    mercadoId: 'm1',
    type,
    timestamp: new Date(),
    metadata: {},
  };
}

describe('summarizeAiNativeFunnel', () => {
  it('conta passos e taxas', () => {
    const events = [
      ev('casa_aberta', 1),
      ev('casa_aberta', 2),
      ev('compra_rascunho_montado', 3),
      ev('compra_confirmada', 4),
    ];
    const s = summarizeAiNativeFunnel(events);
    expect(s.casaAberta).toBe(2);
    expect(s.rascunhoMontado).toBe(1);
    expect(s.compraConfirmada).toBe(1);
    expect(s.taxaCasaParaRascunho).toBe(0.5);
    expect(s.taxaRascunhoParaConfirmacao).toBe(1);
  });
});

describe('funnelMeetsOrBeatsBaseline', () => {
  it('aprova quando taxas piloto ≥ baseline', () => {
    const baseline = {
      casaAberta: 100,
      rascunhoMontado: 40,
      compraConfirmada: 20,
      taxaCasaParaRascunho: 0.4,
      taxaRascunhoParaConfirmacao: 0.5,
    };
    const piloto = {
      casaAberta: 50,
      rascunhoMontado: 25,
      compraConfirmada: 15,
      taxaCasaParaRascunho: 0.5,
      taxaRascunhoParaConfirmacao: 0.6,
    };
    expect(funnelMeetsOrBeatsBaseline(piloto, baseline)).toBe(true);
  });
});
