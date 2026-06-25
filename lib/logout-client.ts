/**
 * Logout completo: limpa tokens locais, chama API que invalida cookies (domain/path corretos)
 * e força navegação completa para evitar estado "autenticado" em cache no React.
 */
'use client';

export async function fullLogout(redirectTo: string = '/login'): Promise<void> {
  try {
    const { authClient } = await import('@/lib/auth-client');
    authClient.clearTokens();
  } catch {
    /* noop */
  }

  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    /* noop */
  }

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    /* noop */
  }

  if (typeof window !== 'undefined') {
    window.location.assign(redirectTo);
  }
}
