import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TokenManager } from '@/lib/token-manager';

export type AdminUser = {
  id: string;
  email: string;
  role: 'ADMIN' | 'GESTOR' | 'CLIENTE';
  nome?: string | null;
};

export type AdminAuthResult = {
  user: AdminUser | null;
  /**
   * true  -> havia alguma sessão NextAuth (email presente), mas não é ADMIN
   * false -> nenhuma sessão válida (não autenticado)
   */
  hasSession: boolean;
};

/**
 * Helper centralizado para autenticação/autorização ADMIN.
 *
 * Fluxo:
 * 1) Tenta validar via TokenManager (Auth V2) com role ADMIN.
 * 2) Fallback: usa sessão NextAuth (JWT) apenas para identificar email.
 * 3) Busca usuário no banco (case-insensitive) e valida role === ADMIN.
 *
 * Retorna:
 * - { user: AdminUser, hasSession: true }  -> autorizado como ADMIN
 * - { user: null, hasSession: false }      -> não autenticado
 * - { user: null, hasSession: true }       -> autenticado, mas sem permissão (não ADMIN)
 */
export async function requireAdmin(request: NextRequest): Promise<AdminAuthResult> {
  try {
    // 1) TokenManager: tokens próprios (Auth V2)
    const tokenUser = await TokenManager.validateRole('ADMIN', {
      headers: request.headers,
      cookies: request.cookies,
    });

    if (tokenUser) {
      return {
        user: {
          id: tokenUser.id,
          email: tokenUser.email,
          role: tokenUser.role,
          nome: tokenUser.nome ?? null,
        },
        hasSession: true,
      };
    }

    // 2) Fallback: sessão NextAuth (identidade via email)
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return { user: null, hasSession: false };
    }

    // 3) Banco é autoridade para role (case-insensitive por segurança)
    const dbUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: session.user.email,
          mode: 'insensitive',
        },
      },
      select: { id: true, email: true, role: true, nome: true },
    });

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return { user: null, hasSession: true };
    }

    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role as 'ADMIN' | 'GESTOR' | 'CLIENTE',
        nome: dbUser.nome,
      },
      hasSession: true,
    };
  } catch (error) {
    console.error('[requireAdmin] auth error:', error);
    return { user: null, hasSession: false };
  }
}

