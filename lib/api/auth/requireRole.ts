import { NextRequest } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import type { AuthResult, AuthUser, Role } from './types';

export async function requireRole(
  request: NextRequest,
  roles: Role[],
): Promise<AuthResult> {
  const tokenUser = await TokenManager.validateRoles(roles, {
    headers: request.headers,
    cookies: request.cookies,
  });

  if (tokenUser) {
    const user: AuthUser = {
      id: tokenUser.id,
      email: tokenUser.email,
      role: tokenUser.role as Role,
      nome: tokenUser.nome ?? null,
    };

    return {
      status: 'authorized',
      user,
    };
  }

  const anyUser = await TokenManager.validateSession({
    headers: request.headers,
    cookies: request.cookies,
  });

  if (anyUser?.id) {
    return { status: 'forbidden' };
  }

  return { status: 'unauthenticated' };
}
