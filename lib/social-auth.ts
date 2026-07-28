/**
 * Configuração server-side dos provedores de login social (BFF Next.js).
 *
 * O BFF apenas monta a URL de autorização, gera state/PKCE e troca cookies.
 * A validação do grant code acontece no Express (/api/v1/auth/social/callback).
 */
import crypto from 'crypto';

export type SocialProvider = 'google' | 'facebook' | 'apple';

export const OAUTH_COOKIE = {
  state: 'precivox-oauth-state',
  verifier: 'precivox-oauth-verifier',
  nonce: 'precivox-oauth-nonce',
  redirect: 'precivox-oauth-redirect', // callbackUrl pós-login
} as const;

interface ProviderConfig {
  authorizeUrl: string;
  scope: string;
  clientId: string | undefined;
  responseMode?: 'query' | 'form_post';
  extraParams?: Record<string, string>;
}

export function getProviderConfig(provider: SocialProvider): ProviderConfig {
  switch (provider) {
    case 'google':
      return {
        authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        scope: 'openid email profile',
        clientId: process.env.GOOGLE_CLIENT_ID,
        responseMode: 'query',
        extraParams: { access_type: 'offline', prompt: 'select_account' },
      };
    case 'facebook':
      return {
        authorizeUrl: `https://www.facebook.com/${process.env.FACEBOOK_GRAPH_VERSION || 'v19.0'}/dialog/oauth`,
        scope: 'email public_profile',
        clientId: process.env.FACEBOOK_CLIENT_ID,
        responseMode: 'query',
      };
    case 'apple':
      return {
        authorizeUrl: 'https://appleid.apple.com/auth/authorize',
        scope: 'name email',
        clientId: process.env.APPLE_CLIENT_ID,
        responseMode: 'form_post', // necessário p/ receber name/email
      };
    default:
      throw new Error(`Provedor não suportado: ${provider}`);
  }
}

export function isSupportedProvider(p: string): p is SocialProvider {
  return p === 'google' || p === 'facebook' || p === 'apple';
}

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = base64url(crypto.randomBytes(48));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

export function randomToken(): string {
  return base64url(crypto.randomBytes(24));
}

/** redirect_uri DEVE ser idêntico no start e no token exchange. */
export function buildRedirectUri(origin: string, provider: SocialProvider): string {
  return `${origin}/api/auth/social/${provider}/callback`;
}

/**
 * Origem pública canônica (atrás de nginx, nextUrl.origin vira localhost:3000).
 * Preferência: NEXT_PUBLIC_URL → x-forwarded-* → nextUrl.origin.
 */
export function resolvePublicOrigin(req: {
  nextUrl: { origin: string };
  headers: { get(name: string): string | null };
}): string {
  const fromEnv = process.env.NEXT_PUBLIC_URL?.replace(/\/$/, '');
  if (fromEnv && /^https?:\/\//i.test(fromEnv) && !/localhost|127\.0\.0\.1/i.test(fromEnv)) {
    return fromEnv;
  }
  const xfHost = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const xfProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
  if (xfHost) return `${xfProto}://${xfHost}`.replace(/\/$/, '');
  const host = req.headers.get('host');
  if (host && !/localhost|127\.0\.0\.1/i.test(host)) {
    return `${xfProto}://${host}`.replace(/\/$/, '');
  }
  return req.nextUrl.origin;
}

export function buildAuthorizeUrl(params: {
  provider: SocialProvider;
  origin: string;
  state: string;
  nonce: string;
  challenge: string;
}): string {
  const cfg = getProviderConfig(params.provider);
  if (!cfg.clientId) {
    throw new Error(`Client ID não configurado para ${params.provider}`);
  }

  const url = new URL(cfg.authorizeUrl);
  url.searchParams.set('client_id', cfg.clientId);
  url.searchParams.set('redirect_uri', buildRedirectUri(params.origin, params.provider));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', cfg.scope);
  url.searchParams.set('state', params.state);
  url.searchParams.set('nonce', params.nonce);
  url.searchParams.set('code_challenge', params.challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  if (cfg.responseMode) url.searchParams.set('response_mode', cfg.responseMode);
  for (const [k, v] of Object.entries(cfg.extraParams ?? {})) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}
