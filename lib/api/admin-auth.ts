import { NextRequest } from 'next/server';
import { getToken, decode } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

const SESSION_COOKIE =
  process.env.NODE_ENV === 'production'
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';

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
    const secret = process.env.NEXTAUTH_SECRET;
    // getToken() falha em Route Handlers porque next-auth espera req.cookies como Map/getAll;
    // NextRequest.cookies é ReadonlyRequestCookies com apenas .get(name).
    let token = await getToken({
      req: request as any,
      secret,
    });
    if (!token) {
      const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
      if (sessionToken && secret) {
        token = await decode({ token: sessionToken, secret });
      }
    }

    if (!token?.email) {
      return { user: null, hasSession: false };
    }

    const email = token.email as string;

    // Banco é autoridade para role (case-insensitive por segurança)
    const dbUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
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

