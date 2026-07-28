import { NextRequest, NextResponse } from 'next/server';
import { internalFetch } from '@/lib/internal-backend';
import { buildRedirectUri, isSupportedProvider, OAUTH_COOKIE, SocialProvider } from '@/lib/social-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface CallbackInput {
  code: string | null;
  state: string | null;
  error: string | null;
  profileName: string | null;
}

function setSessionCookies(res: NextResponse, accessToken: string, refreshToken: string) {
  const prefix = process.env.NODE_ENV === 'production' ? '__Secure-' : '';
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
  res.cookies.set(`${prefix}precivox-access-token`, accessToken, { ...base, maxAge: 15 * 60 });
  res.cookies.set(`${prefix}precivox-refresh-token`, refreshToken, { ...base, maxAge: 7 * 24 * 60 * 60 });
}

function clearOauthCookies(res: NextResponse) {
  for (const name of Object.values(OAUTH_COOKIE)) {
    res.cookies.set(name, '', { path: '/', maxAge: 0 });
  }
}

function parseAppleUser(userField: string | null): string | null {
  if (!userField) return null;
  try {
    const parsed = JSON.parse(userField);
    const name = parsed?.name;
    if (name?.firstName || name?.lastName) {
      return [name.firstName, name.lastName].filter(Boolean).join(' ').trim() || null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function readInput(req: NextRequest): Promise<CallbackInput> {
  if (req.method === 'POST') {
    // Apple usa response_mode=form_post
    const form = await req.formData();
    return {
      code: (form.get('code') as string) ?? null,
      state: (form.get('state') as string) ?? null,
      error: (form.get('error') as string) ?? null,
      profileName: parseAppleUser((form.get('user') as string) ?? null),
    };
  }
  const sp = req.nextUrl.searchParams;
  return {
    code: sp.get('code'),
    state: sp.get('state'),
    error: sp.get('error'),
    profileName: null,
  };
}

async function handle(req: NextRequest, provider: string) {
  const origin = req.nextUrl.origin;
  const loginErrorUrl = (reason: string) => new URL(`/login?error=${reason}`, origin);

  if (!isSupportedProvider(provider)) {
    return NextResponse.redirect(loginErrorUrl('provider_unsupported'));
  }

  const { code, state, error, profileName } = await readInput(req);
  if (error || !code) {
    return NextResponse.redirect(loginErrorUrl('social_denied'));
  }

  // CSRF: state precisa bater com o cookie
  const cookieState = req.cookies.get(OAUTH_COOKIE.state)?.value;
  if (!state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(loginErrorUrl('state_mismatch'));
  }

  const codeVerifier = req.cookies.get(OAUTH_COOKIE.verifier)?.value;
  const postLoginRedirect = req.cookies.get(OAUTH_COOKIE.redirect)?.value || '/cliente/casa';
  const redirectUri = buildRedirectUri(origin, provider as SocialProvider);

  try {
    const backendRes = await internalFetch('/api/v1/auth/social/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: provider.toUpperCase(),
        code,
        codeVerifier,
        redirectUri,
        profileName,
      }),
    });

    const data = await backendRes.json().catch(() => ({}));
    if (!backendRes.ok || !data?.success || !data?.data?.accessToken) {
      console.error('[social/callback] backend falhou:', data);
      return NextResponse.redirect(loginErrorUrl('social_failed'));
    }

    const { accessToken, refreshToken } = data.data;

    // Deep link mobile: devolve tokens ao app via fragmento de uso único.
    const isDeepLink = /^[a-z][a-z0-9+.-]*:\/\//i.test(postLoginRedirect) && !postLoginRedirect.startsWith('http');
    const target = isDeepLink
      ? `${postLoginRedirect}#access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`
      : new URL(postLoginRedirect, origin).toString();

    const res = NextResponse.redirect(target);
    if (!isDeepLink) setSessionCookies(res, accessToken, refreshToken);
    clearOauthCookies(res);
    return res;
  } catch (err) {
    console.error('[social/callback]', err);
    return NextResponse.redirect(loginErrorUrl('social_error'));
  }
}

export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  return handle(req, params.provider);
}

export async function POST(req: NextRequest, { params }: { params: { provider: string } }) {
  return handle(req, params.provider);
}
