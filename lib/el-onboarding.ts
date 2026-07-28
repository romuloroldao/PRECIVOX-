/**
 * Onboarding de Economia Líquida — gatilhos e elegibilidade.
 */

import {
  parseElPreferenciasFromPerfil,
  type ElPreferenciasUsuario,
} from '@/lib/el-config-preferencias';
import { parseElConfigFromPerfil } from '@/lib/el-config-usuario';

export const EL_ONBOARDING_SNOOZE_KEY = 'precivox_el_onboarding_snooze_until';
export const EL_ONBOARDING_SESSION_KEY = 'precivox_el_onboarding_prompt_session';
export const EL_ONBOARDING_SNOOZE_MS = 24 * 60 * 60 * 1000;

export type ElOnboardingGatilho = 'busca_el' | 'scan_el';

export function elOnboardingSnoozed(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = localStorage.getItem(EL_ONBOARDING_SNOOZE_KEY);
  if (!raw) return false;
  const until = parseInt(raw, 10);
  return Number.isFinite(until) && Date.now() < until;
}

export function snoozeElOnboarding(ms = EL_ONBOARDING_SNOOZE_MS): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EL_ONBOARDING_SNOOZE_KEY, String(Date.now() + ms));
}

/** Usuário já configurou EL (preferências, legado ou flag explícita). */
export function elOnboardingCompleto(perfilPreci: unknown): boolean {
  if (!perfilPreci || typeof perfilPreci !== 'object') return false;
  const base = perfilPreci as {
    elConfig?: { onboardingCompleto?: boolean; preferencias?: ElPreferenciasUsuario };
  };
  if (base.elConfig?.onboardingCompleto) return true;
  if (parseElPreferenciasFromPerfil(perfilPreci)) return true;
  if (parseElConfigFromPerfil(perfilPreci)) return true;
  return false;
}

type ProdutoComEl = {
  melhorAlternativa?: {
    economiaLiquida?: {
      economiaLiquida?: number;
      recomendacao?: string;
    } | null;
  } | null;
};

export function produtoExibeEl(produto: ProdutoComEl): boolean {
  const el = produto.melhorAlternativa?.economiaLiquida;
  if (!el) return false;
  if (el.recomendacao === 'ir' || el.recomendacao === 'ficar') return true;
  return (el.economiaLiquida ?? 0) > 0;
}

export function listaTemElVisivel<T extends ProdutoComEl>(itens: T[]): boolean {
  return itens.some(produtoExibeEl);
}

export function dispararElOnboardingPrompt(gatilho: ElOnboardingGatilho): void {
  if (typeof window === 'undefined') return;
  if (sessionStorage.getItem(EL_ONBOARDING_SESSION_KEY)) return;
  sessionStorage.setItem(EL_ONBOARDING_SESSION_KEY, '1');
  window.dispatchEvent(
    new CustomEvent('precivox-el-onboarding-prompt', { detail: { gatilho, delayMs: 600 } })
  );
}
