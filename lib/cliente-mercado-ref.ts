/**
 * Mercado de referência em sessão (FAB Scanner / Hub) — Fase 5.
 */

const KEY = 'precivox_mercado_sugestao';

export function rememberMercadoId(mercadoId: string | null | undefined): void {
  if (typeof window === 'undefined' || !mercadoId) return;
  try {
    sessionStorage.setItem(KEY, mercadoId);
  } catch {
    /* ignore */
  }
}

export function getRememberedMercadoId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Href do scanner com mercado opcional (Regra 6 — 1 toque). */
export function buildScanHref(mercadoId?: string | null): string {
  const id = mercadoId || getRememberedMercadoId();
  if (id) return `/cliente/scan?mercadoId=${encodeURIComponent(id)}`;
  return '/cliente/scan';
}
