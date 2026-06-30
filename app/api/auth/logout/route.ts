import { NextRequest, NextResponse } from 'next/server';
import { internalFetch } from '@/lib/internal-backend';
import {
  clearAuthSessionCookies,
  getRefreshTokenFromCookies,
} from '@/lib/auth-session-cookies';
import { TokenManager } from '@/lib/token-manager';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = getRefreshTokenFromCookies(request.cookies);

    if (refreshToken) {
      await TokenManager.revokeRefreshToken(refreshToken).catch(() => undefined);
      await internalFetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => undefined);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });

    clearAuthSessionCookies(response);

    return response;
  } catch (error) {
    console.error('Erro no logout:', error);
    const response = NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
    clearAuthSessionCookies(response);
    return response;
  }
}
