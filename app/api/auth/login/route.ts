import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { validateCredentials } from '@/lib/auth-credentials';
import { setAuthSessionCookies } from '@/lib/auth-session-cookies';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/auth/login
 * Login nativo e-mail/senha — emite tokens Precivox (TokenManager) sem NextAuth.
 * Body: { email, password } ou { email, senha }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email : '';
    const password =
      typeof body.password === 'string'
        ? body.password
        : typeof body.senha === 'string'
          ? body.senha
          : '';

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const result = await validateCredentials(email, password);

    if (result.ok === false) {
      if (result.code === 'EMAIL_NOT_VERIFIED') {
        return NextResponse.json(
          {
            success: false,
            code: 'EMAIL_NOT_VERIFIED',
            error: result.error,
            email: result.email,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { success: false, code: result.code, error: result.error },
        { status: 401 }
      );
    }

    const { user } = result;
    const pair = await TokenManager.issueTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
      nome: user.nome,
      tokenVersion: user.tokenVersion,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome ?? '',
        role: user.role,
        imagem: user.imagem,
      },
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
      expiresAt: pair.expiresAt.toISOString(),
    });

    setAuthSessionCookies(response, pair.accessToken, pair.refreshToken);
    return response;
  } catch (error) {
    console.error('[API /auth/login] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar login' },
      { status: 500 }
    );
  }
}
