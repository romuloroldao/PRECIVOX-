/**
 * Helpers de autenticação server-side (RSC, layouts, redirects).
 * Autoridade: TokenManager (cookies precivox-*), sem NextAuth.
 */
import { redirect } from 'next/navigation';
import { getDashboardUrl } from './redirect';
import { getServerSessionUser } from './api-auth';
import type { SessionUser } from '@/lib/token-manager';

/**
 * Obtém usuário autenticado no servidor (null se não logado).
 */
export async function getSession(): Promise<SessionUser | null> {
  return getServerSessionUser();
}

/**
 * Exige autenticação; redireciona para /login se ausente.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getServerSessionUser();
  if (!user) redirect('/login');
  return user;
}

/**
 * Exige uma ou mais roles; redireciona para dashboard apropriado se negado.
 */
export async function requireRole(role: string | string[]): Promise<SessionUser> {
  const user = await requireAuth();
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!allowedRoles.includes(user.role)) {
    redirect(getDashboardUrl(user.role));
  }

  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole('ADMIN');
}

export async function requireGestor(): Promise<SessionUser> {
  return requireRole(['ADMIN', 'GESTOR']);
}
