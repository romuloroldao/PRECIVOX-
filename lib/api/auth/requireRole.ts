import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { status: 'unauthenticated' };
  }

  const email = session.user.email;

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

