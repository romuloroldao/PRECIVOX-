/**
 * Funil AI-Native — Casa → rascunho → confirmação (Fase 9).
 * Contagem a partir de UserEvent (EventCollector).
 */

import type { UserEvent, UserEventType } from '@/lib/ai/types';

export const AI_NATIVE_FUNNEL_STEPS = [
  'casa_aberta',
  'compra_rascunho_montado',
  'compra_confirmada',
] as const satisfies readonly UserEventType[];

export type AiNativeFunnelCounts = {
  casaAberta: number;
  rascunhoMontado: number;
  compraConfirmada: number;
  /** rascunho / casa (0–1); null se sem Casa */
  taxaCasaParaRascunho: number | null;
  /** confirmação / rascunho (0–1); null se sem rascunho */
  taxaRascunhoParaConfirmacao: number | null;
};

function countType(events: UserEvent[], type: UserEventType): number {
  return events.reduce((n, e) => (e.type === type ? n + 1 : n), 0);
}

export function summarizeAiNativeFunnel(events: UserEvent[]): AiNativeFunnelCounts {
  const casaAberta = countType(events, 'casa_aberta');
  const rascunhoMontado = countType(events, 'compra_rascunho_montado');
  const compraConfirmada = countType(events, 'compra_confirmada');

  return {
    casaAberta,
    rascunhoMontado,
    compraConfirmada,
    taxaCasaParaRascunho: casaAberta > 0 ? rascunhoMontado / casaAberta : null,
    taxaRascunhoParaConfirmacao: rascunhoMontado > 0 ? compraConfirmada / rascunhoMontado : null,
  };
}

/** Compara piloto vs baseline (mesma janela). true se funil piloto ≥ baseline nas taxas. */
export function funnelMeetsOrBeatsBaseline(
  piloto: AiNativeFunnelCounts,
  baseline: AiNativeFunnelCounts
): boolean {
  const t1p = piloto.taxaCasaParaRascunho;
  const t1b = baseline.taxaCasaParaRascunho;
  const t2p = piloto.taxaRascunhoParaConfirmacao;
  const t2b = baseline.taxaRascunhoParaConfirmacao;

  if (t1p == null || t1b == null || t2p == null || t2b == null) return false;
  return t1p >= t1b && t2p >= t2b;
}
