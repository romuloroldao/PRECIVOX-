import { NextRequest, NextResponse } from 'next/server';
import {
  buildAuthorizeUrl,
  generatePkce,
  isSupportedProvider,
  OAUTH_COOKIE,
  randomToken,
} from '@/lib/social-auth';
import { safeCallbackUrl } from '@/lib/safe-callback-url';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/auth/social/:provider/start
 * Inicia o fluxo OAuth: gera state + PKCE + nonce, guarda em cookies httpOnly
 * e redireciona o usuário para o provedor.
 */
export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const provider = params.provider;
  if (!isSupportedProvider(provider)) {
    return NextResponse.json({ error: 'Provedor não suportado' }, { status: 400 });
  }

  try {
    const origin = req.nextUrl.origin;
    const state = randomToken();
    const nonce = randomToken();
    const { verifier, challenge } = generatePkce();

    // Mobile: retorna ao app via deep link; Web: caminho interno seguro.
    const isMobile = req.nextUrl.searchParams.get('platform') === 'mobile';
    const callbackUrl = isMobile
      ? process.env.MOBILE_DEEP_LINK || 'precivox://auth/callback'
      : safeCallbackUrl(req.nextUrl.searchParams.get('callbackUrl'));

    const authorizeUrl = buildAuthorizeUrl({ provider, origin, state, nonce, challenge });
    const res = NextResponse.redirect(authorizeUrl);

    const isProd = process.env.NODE_ENV === 'production';
    // sameSite 'none' em prod para sobreviver ao form_post cross-site da Apple.
    const cookieOpts = {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
      maxAge: 600, // 10 min
    };

    res.cookies.set(OAUTH_COOKIE.state, state, cookieOpts);
    res.cookies.set(OAUTH_COOKIE.nonce, nonce, cookieOpts);
    res.cookies.set(OAUTH_COOKIE.verifier, verifier, cookieOpts);
    res.cookies.set(OAUTH_COOKIE.redirect, callbackUrl, cookieOpts);

    return res;
  } catch (err) {
    console.error('[social/start]', err);
    return NextResponse.redirect(new URL('/login?error=social_config', req.nextUrl.origin));
  }
}
