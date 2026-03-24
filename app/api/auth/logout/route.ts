import { NextRequest, NextResponse } from 'next/server';
import { internalFetch } from '@/lib/internal-backend';

const production = process.env.NODE_ENV === 'production';
const cookiePrefix = production ? '__Secure-' : '';
const domain = production ? '.precivox.com.br' : undefined;

/** Expira cookie igual ao usado no login (path + domain + flags). */
function expireCookie(
  response: NextResponse,
  name: string,
  options: { httpOnly?: boolean } = {}
) {
  const isHostOnly = name.startsWith('__Host-');
  response.cookies.set(name, '', {
    path: '/',
    ...(isHostOnly ? {} : { domain }),
    maxAge: 0,
    httpOnly: options.httpOnly ?? false,
    sameSite: 'lax',
    secure: production,
  });
}

export async function POST(request: NextRequest) {
  try {
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

    // NextAuth — mesmos nomes que lib/auth.ts (httpOnly no session token)
    expireCookie(response, `${cookiePrefix}next-auth.session-token`, { httpOnly: true });
    expireCookie(response, 'next-auth.session-token', { httpOnly: true });
    expireCookie(response, '__Secure-next-auth.session-token', { httpOnly: true });

    expireCookie(response, 'next-auth.csrf-token');
    expireCookie(response, '__Host-next-auth.csrf-token');
    expireCookie(response, 'next-auth.callback-url');
    expireCookie(response, '__Secure-next-auth.callback-url');

    expireCookie(response, `${cookiePrefix}precivox-access-token`, { httpOnly: true });
    expireCookie(response, 'precivox-access-token', { httpOnly: true });
    expireCookie(response, '__Secure-precivox-access-token', { httpOnly: true });
    expireCookie(response, refreshCookieName, { httpOnly: true });

    return response;
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
