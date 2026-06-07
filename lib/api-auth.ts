import { NextRequest, NextResponse } from 'next/server';
import { TokenManager, type SessionUser } from '@/lib/token-manager';

type Role = SessionUser['role'];

/**
 * Valida sessão em route handlers. Retorna NextResponse de erro ou o usuário autenticado.
 */
export async function requireApiSession(
  req: NextRequest,
  options?: { roles?: Role[] },
): Promise<SessionUser | NextResponse> {
  const user = await TokenManager.validateSession({
    headers: req.headers,
    cookies: req.cookies,
  });

  if (!user?.id || user.id === 'anonymous') {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  if (options?.roles?.length && !options.roles.includes(user.role)) {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
  }

  return user;
}

export function isAuthResponse(result: SessionUser | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
