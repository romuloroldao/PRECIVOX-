import { NextResponse } from 'next/server';

const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export function getAuthCookiePrefix(): string {
  return process.env.NODE_ENV === 'production' ? '__Secure-' : '';
}

/** Define cookies httpOnly de access + refresh (TokenManager). */
export function setAuthSessionCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): void {
  const prefix = getAuthCookiePrefix();
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };

  response.cookies.set(`${prefix}precivox-access-token`, accessToken, {
    ...base,
    maxAge: ACCESS_MAX_AGE,
  });
  response.cookies.set(`${prefix}precivox-refresh-token`, refreshToken, {
    ...base,
    maxAge: REFRESH_MAX_AGE,
  });
}
