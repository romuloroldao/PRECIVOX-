/**
 * API Route: Renovar tokens usando refresh token
 * 
 * Rotaciona refresh token (revoga antigo, cria novo)
 */

import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { setAuthSessionCookies } from '@/lib/auth-session-cookies';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token não fornecido' },
        { status: 400 }
      );
    }

    // Rotacionar refresh token
    const tokens = await TokenManager.rotateRefreshToken(refreshToken);

    if (!tokens) {
      return NextResponse.json(
        { error: 'Refresh token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Criar resposta com cookies
    const response = NextResponse.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt.toISOString(),
    });

    setAuthSessionCookies(response, tokens.accessToken, tokens.refreshToken);

    return response;
  } catch (error) {
    console.error('[API /auth/refresh] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao renovar tokens' },
      { status: 500 }
    );
  }
}

