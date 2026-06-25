import { NextRequest } from 'next/server';
import { TokenManager } from '@/lib/token-manager';

export type AdminUser = {
  id: string;
  email: string;
  role: 'ADMIN' | 'GESTOR' | 'CLIENTE';
  nome?: string | null;
};

export type AdminAuthResult = {
  user: AdminUser | null;
  /** true se havia sessão válida, mesmo sem role ADMIN */
  hasSession: boolean;
};

function toAdminUser(user: {
  id: string;
  email: string;
  role: 'ADMIN' | 'GESTOR' | 'CLIENTE';
  nome?: string | null;
}): AdminUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    nome: user.nome ?? null,
  };
}

async function sessionFromRequest(request: NextRequest) {
  return TokenManager.validateSession({
    headers: request.headers,
    cookies: request.cookies,
  });
}

/** Autenticação/autorização ADMIN via TokenManager (cookies precivox-*). */
export async function requireAdmin(request: NextRequest): Promise<AdminAuthResult> {
  try {
    const admin = await TokenManager.validateRole('ADMIN', {
      headers: request.headers,
      cookies: request.cookies,
    });

    if (admin) {
      return { user: toAdminUser(admin), hasSession: true };
    }

    const session = await sessionFromRequest(request);
    if (session) {
      return { user: null, hasSession: true };
    }

    return { user: null, hasSession: false };
  } catch (error) {
    console.error('[requireAdmin] auth error:', error);
    return { user: null, hasSession: false };
  }
}

/** Qualquer usuário autenticado (ADMIN, GESTOR ou CLIENTE). */
export async function requireAuth(request: NextRequest): Promise<AdminAuthResult> {
  try {
    const session = await sessionFromRequest(request);
    if (!session) {
      return { user: null, hasSession: false };
    }

    return { user: toAdminUser(session), hasSession: true };
  } catch (error) {
    console.error('[requireAuth] auth error:', error);
    return { user: null, hasSession: false };
  }
}
