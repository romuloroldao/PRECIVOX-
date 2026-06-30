import { NextResponse } from 'next/server';

const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

/** Nomes canônicos usados em login (host-only, sem domain). */
export const AUTH_ACCESS_COOKIE_NAMES = [
  'precivox-access-token',
  '__Secure-precivox-access-token',
] as const;

export const AUTH_REFRESH_COOKIE_NAMES = [
  'precivox-refresh-token',
  '__Secure-precivox-refresh-token',
] as const;

export function getAuthCookiePrefix(): string {
  return process.env.NODE_ENV === 'production' ? '__Secure-' : '';
}

function getProductionCookieDomain(): string | undefined {
  return process.env.NODE_ENV === 'production' ? '.precivox.com.br' : undefined;
}

function cookieBaseOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}

function buildExpiredCookieHeader(name: string, domain?: string): string {
  const secure = process.env.NODE_ENV === 'production';
  const parts = [
    `${name}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (domain) parts.push(`Domain=${domain}`);
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

/**
 * Expira cookie host-only e, em produção, variante com domain.
 * Usa headers.append para domain — response.cookies.set sobrescreve pelo nome.
 */
function expireCookieVariant(response: NextResponse, name: string): void {
  const base = cookieBaseOptions();
  response.cookies.set(name, '', { ...base, maxAge: 0 });

  const domain = getProductionCookieDomain();
  if (domain && !name.startsWith('__Host-')) {
    response.headers.append('Set-Cookie', buildExpiredCookieHeader(name, domain));
  }
}

/** Define cookies httpOnly de access + refresh (TokenManager). */
export function setAuthSessionCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): void {
  const prefix = getAuthCookiePrefix();
  const base = cookieBaseOptions();

  response.cookies.set(`${prefix}precivox-access-token`, accessToken, {
    ...base,
    maxAge: ACCESS_MAX_AGE,
  });
  response.cookies.set(`${prefix}precivox-refresh-token`, refreshToken, {
    ...base,
    maxAge: REFRESH_MAX_AGE,
  });
}

/** Remove todos os cookies de sessão Precivox (todas as variantes conhecidas). */
export function clearAuthSessionCookies(response: NextResponse): void {
  for (const name of AUTH_ACCESS_COOKIE_NAMES) {
    expireCookieVariant(response, name);
  }
  for (const name of AUTH_REFRESH_COOKIE_NAMES) {
    expireCookieVariant(response, name);
  }
}

/** Lê refresh token dos cookies da requisição (qualquer variante). */
export function getRefreshTokenFromCookies(
  cookies: { get: (name: string) => { value: string } | undefined }
): string | undefined {
  for (const name of AUTH_REFRESH_COOKIE_NAMES) {
    const value = cookies.get(name)?.value;
    if (value) return value;
  }
  const prefix = getAuthCookiePrefix();
  return cookies.get(`${prefix}precivox-refresh-token`)?.value;
}
