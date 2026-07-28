/**
 * Feature flag — shell AI-Native (Fase 0/1).
 * Default: OFF. Liga com NEXT_PUBLIC_AI_NATIVE_SHELL=true
 * ou cookie `AI_NATIVE_SHELL=1` (QA sem rebuild).
 *
 * @see docs/PROPOSTA_AI_NATIVE_SHOPPING_JOURNEY.md
 */

export const AI_NATIVE_SHELL_COOKIE = 'AI_NATIVE_SHELL';

/** Valor de ambiente (build-time / server). */
export function isAiNativeShellEnvEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AI_NATIVE_SHELL === 'true';
}

/**
 * Resolução client-side: cookie sobrescreve env.
 * Em SSR sem cookie, usa apenas env.
 */
export function isAiNativeShellEnabled(): boolean {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)AI_NATIVE_SHELL=([01])/);
    if (match) return match[1] === '1';
  }
  return isAiNativeShellEnvEnabled();
}

/** Destino pós-login / logo do shell cliente — Casa / Agora. */
export function clienteHomeHref(_aiNative = isAiNativeShellEnabled()): string {
  return '/cliente/casa';
}
