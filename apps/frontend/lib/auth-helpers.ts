/**
 * SERVER ONLY - Helpers para autenticação (ARCH-FREEZE-01: usa auth-next para sessão).
 */
import 'server-only';
import { validateSession } from '@/lib/auth-next';
import type { SessionUser } from '@/lib/token-manager';
import { NextRequest } from 'next/server';

/**
 * Obtém a sessão do usuário via TokenManager
 * Retorna null se não autenticado
 */
export async function getSessionUser(
  request?: NextRequest
): Promise<SessionUser | null> {
  try {
    const headers = request?.headers || new Headers();
    const cookies = request?.cookies || { get: () => undefined };
    
    return await validateSession({
      headers,
      cookies: cookies as any,
    });
  } catch (error) {
    console.error('[getSessionUser] Erro ao obter sessão:', error);
    return null;
  }
}

/**
 * Valida se o usuário está autenticado
 * Lança erro com statusCode 401 se não autenticado
 */
export async function requireAuth(
  request?: NextRequest
): Promise<SessionUser> {
  const user = await getSessionUser(request);
  
  if (!user) {
    const error = new Error('UNAUTHORIZED') as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }
  
  return user;
}

/**
 * Valida se o usuário tem uma role específica
 * Lança erro com statusCode 403 se não tiver permissão
 */
export async function requireRole(
  allowedRoles: SessionUser['role'][],
  request?: NextRequest
): Promise<SessionUser> {
  const user = await requireAuth(request);
  
  if (!allowedRoles.includes(user.role)) {
    const error = new Error('FORBIDDEN') as Error & { statusCode?: number };
    error.statusCode = 403;
    throw error;
  }
  
  return user;
}

/**
 * Valida se o usuário é ADMIN
 */
export async function requireAdmin(
  request?: NextRequest
): Promise<SessionUser> {
  return requireRole(['ADMIN'], request);
}

/**
 * Valida se o usuário é GESTOR ou ADMIN
 */
export async function requireGestorOrAdmin(
  request?: NextRequest
): Promise<SessionUser> {
  return requireRole(['GESTOR', 'ADMIN'], request);
}

/**
 * Valida se o usuário é ADMIN ou GESTOR (alias)
 */
export async function requireAdminOrGestor(
  request?: NextRequest
): Promise<SessionUser> {
  return requireRole(['ADMIN', 'GESTOR'], request);
}
