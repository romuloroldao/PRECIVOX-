// Helpers para autenticação com NextAuth
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';
import { redirect } from 'next/navigation';
import { getDashboardUrl } from './redirect';

/**
 * Obtém a sessão do servidor
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Verifica se o usuário está autenticado (server-side)
 */
export async function requireAuth() {
  const session = await getSession();
  
  if (!session || !session.user) {
    redirect('/login');
  }
  
  return session;
}

/**
 * Verifica se o usuário tem uma role específica
 */
export async function requireRole(role: string | string[]) {
  const session = await requireAuth();
  const userRole = (session.user as any).role;
  
  const allowedRoles = Array.isArray(role) ? role : [role];
  
  if (!allowedRoles.includes(userRole)) {
    // Redirecionar para o dashboard apropriado
    redirect(getDashboardUrl(userRole));
  }
  
  return session;
}

/**
 * Verifica se o usuário é admin
 */
export async function requireAdmin() {
  return await requireRole('ADMIN');
}

/**
 * Verifica se o usuário é gestor ou admin
 */
export async function requireGestor() {
  return await requireRole(['ADMIN', 'GESTOR']);
}

