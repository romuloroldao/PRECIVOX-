import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { TokenManager } from '@/lib/token-manager';
import type { AuthResult, AuthUser, Role } from './types';

export async function requireRole(
  request: NextRequest,
  roles: Role[],
): Promise<AuthResult> {
  // 1) Caminho preferencial: Auth V2 (TokenManager)
  console.log('[requireRole] iniciando validação de role', { roles });
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

  // 2) Fallback: token JWT do NextAuth (strategy: 'jwt')
  console.log('[requireRole] TokenManager não encontrou usuário, tentando getToken()');
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  });

  console.log('[requireRole] Resultado getToken', {
    hasToken: !!token,
    email: token?.email,
    tokenRole: (token as any)?.role,
  });

  if (!token?.email) {
    console.warn('[requireRole] Nenhum email no token, retornando unauthenticated');
    return { status: 'unauthenticated' };
  }

  const email = token.email as string;

  const dbUser = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
      nome: true,
    },
  });

  if (!dbUser) {
    return { status: 'forbidden' };
  }

  if (!roles.includes(dbUser.role as Role)) {
    return { status: 'forbidden' };
  }

  return {
    status: 'authorized',
    user: {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role as Role,
      nome: dbUser.nome,
    },
  };
}

