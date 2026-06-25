import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { TokenManager, type SessionUser } from '@/lib/token-manager';

type Role = SessionUser['role'];

function sessionFromRequest(req: NextRequest) {
  return TokenManager.validateSession({
    headers: req.headers,
    cookies: req.cookies,
  });
}

/**
 * Valida sessão em route handlers. Retorna NextResponse de erro ou o usuário autenticado.
 */
export async function requireApiSession(
  req: NextRequest,
  options?: { roles?: Role[] },
): Promise<SessionUser | NextResponse> {
  const user = await sessionFromRequest(req);

  if (!user?.id || user.id === 'anonymous') {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  if (options?.roles?.length && !options.roles.includes(user.role)) {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
  }

  return user;
}

/** Sessão opcional (ex.: APIs públicas com personalização se logado). */
export async function getOptionalApiSession(req: NextRequest): Promise<SessionUser | null> {
  const user = await sessionFromRequest(req);
  if (!user?.id || user.id === 'anonymous') return null;
  return user;
}

/** Valida sessão em Server Components / layouts (cookies do request atual). */
export async function getServerSessionUser(): Promise<SessionUser | null> {
  const user = await TokenManager.validateSession({
    headers: headers(),
    cookies: cookies(),
  });
  if (!user?.id || user.id === 'anonymous') return null;
  return user;
}

export function isAuthResponse(result: SessionUser | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
