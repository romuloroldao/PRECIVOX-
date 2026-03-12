import { NextRequest, NextResponse } from 'next/server';
import { internalFetch } from '@/lib/internal-backend';
import { TokenManager } from '@/lib/token-manager';

export const dynamic = 'force-dynamic';

const PLACEHOLDER_TOKEN = '(use token do Next)';
const PLACEHOLDER_REFRESH = '(use refresh do Next)';

function isValidToken(value: unknown): value is string {
  return typeof value === 'string' && value.length > 10 && value !== PLACEHOLDER_TOKEN && value !== PLACEHOLDER_REFRESH;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const backendRes = await internalFetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || data.message || 'Erro ao fazer login',
        },
        { status: backendRes.status }
      );
    }

    if (!data.success || !data.data?.user) {
      return NextResponse.json(
        { success: false, error: 'Resposta inválida do backend' },
        { status: 502 }
      );
    }

    const backendUser = data.data.user as { id?: string; email?: string; nome?: string; name?: string; role?: string };
    const accessTokenFromBackend = data.data.accessToken ?? data.data.token;
    const refreshTokenFromBackend = data.data.refreshToken;

    let accessToken: string;
    let refreshToken: string;

    if (isValidToken(accessTokenFromBackend) && isValidToken(refreshTokenFromBackend)) {
      accessToken = accessTokenFromBackend;
      refreshToken = refreshTokenFromBackend;
    } else {
      // Backend não envia tokens reais (ex: placeholders) — BFF emite os tokens
      const role = (backendUser.role ?? 'CLIENTE').toUpperCase() as 'ADMIN' | 'GESTOR' | 'CLIENTE';
      if (!['ADMIN', 'GESTOR', 'CLIENTE'].includes(role)) {
        return NextResponse.json(
          { success: false, error: 'Resposta inválida do backend (role inválido)' },
          { status: 502 }
        );
      }
      const sessionUser = {
        id: backendUser.id!,
        email: backendUser.email!,
        role,
        nome: backendUser.nome ?? backendUser.name ?? null,
      };
      const pair = await TokenManager.issueTokenPair(sessionUser);
      accessToken = pair.accessToken;
      refreshToken = pair.refreshToken;
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: backendUser.id,
        email: backendUser.email,
        nome: backendUser.nome ?? backendUser.name ?? '',
        role: backendUser.role,
      },
      accessToken,
      refreshToken,
    });

    const cookiePrefix = process.env.NODE_ENV === 'production' ? '__Secure-' : '';

    response.cookies.set(`${cookiePrefix}precivox-access-token`, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });

    response.cookies.set(`${cookiePrefix}precivox-refresh-token`, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('[API /auth/login] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar login' },
      { status: 500 }
    );
  }
}
