/**
 * Logout completo: invalida sessão no servidor, limpa estado local
 * e redireciona para a Home com navegação completa (sem cache React).
 */
'use client';

import { LOGOUT_BROADCAST_KEY, invalidateClientSession } from '@/lib/hooks/useSession';

/** Destino padrão após logout — página pública inicial. */
export const LOGOUT_REDIRECT = '/';

function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem('precivox_tokens');
    // Dados de lista são escopados por usuário — limpar no logout evita que a
    // próxima conta na mesma máquina herde listas do usuário anterior.
    localStorage.removeItem('precivox_listas_salvas');
    localStorage.removeItem('precivox_lista_ativa_id');
    localStorage.removeItem(LOGOUT_BROADCAST_KEY);
    localStorage.setItem(LOGOUT_BROADCAST_KEY, String(Date.now()));
  } catch {
    /* noop */
  }
}

function broadcastLogout(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOGOUT_BROADCAST_KEY, String(Date.now()));
  } catch {
    /* noop */
  }
}

export async function fullLogout(redirectTo: string = LOGOUT_REDIRECT): Promise<void> {
  if (typeof window === 'undefined') return;

  const { authClient } = await import('@/lib/auth-client');
  authClient.beginLogout();
  invalidateClientSession();
  clearAuthStorage();

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    });
  } catch {
    /* noop — redirecionamento e limpeza local continuam */
  } finally {
    authClient.clearTokens();
    broadcastLogout();
    window.location.replace(redirectTo);
  }
}
