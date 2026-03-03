import { NextRequest, NextResponse } from 'next/server';
import { internalFetch } from '@/lib/internal-backend';

export async function POST(request: NextRequest) {
  try {
    const cookiePrefix = process.env.NODE_ENV === 'production' ? '__Secure-' : '';
    const refreshCookieName = `${cookiePrefix}precivox-refresh-token`;

    const refreshToken = request.cookies.get(refreshCookieName)?.value;

    if (refreshToken) {
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

    const sessionCookieName = `${cookiePrefix}next-auth.session-token`;

    response.cookies.delete(sessionCookieName);
    response.cookies.delete('next-auth.csrf-token');
    response.cookies.delete('next-auth.callback-url');
    response.cookies.delete('__Secure-next-auth.session-token');
    response.cookies.delete('next-auth.session-token');

    response.cookies.delete(`${cookiePrefix}precivox-access-token`);
    response.cookies.delete('precivox-access-token');
    response.cookies.delete('__Secure-precivox-access-token');
    response.cookies.delete(refreshCookieName);

    return response;
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
