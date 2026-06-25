/**
 * Google OAuth 2.0 / OpenID Connect adapter.
 *
 * Fluxo: troca o authorization code (com PKCE) por tokens e valida o id_token
 * contra o JWKS público do Google (assinatura + iss + aud + exp).
 *
 * Env necessários: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 */
import { createRemoteJWKSet, jwtVerify } from 'jose';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

export const googleProvider = {
  name: 'GOOGLE',

  async exchangeAndVerify({ code, codeVerifier, redirectUri }) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error('GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET ausentes');
    }

    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
    if (codeVerifier) body.set('code_verifier', codeVerifier);

    const res = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const tokens = await res.json().catch(() => ({}));
    if (!res.ok || !tokens.id_token) {
      throw new Error(`Falha na troca de code (Google): ${tokens.error_description || tokens.error || res.status}`);
    }

    const { payload } = await jwtVerify(tokens.id_token, JWKS, {
      issuer: ISSUERS,
      audience: clientId,
    });

    return {
      sub: String(payload.sub),
      email: payload.email ? String(payload.email).toLowerCase() : null,
      emailVerified: payload.email_verified === true || payload.email_verified === 'true',
      isPrivateRelay: false,
      name: payload.name ?? null,
      avatar: payload.picture ?? null,
      providerAccessToken: tokens.access_token ?? null,
      providerRefreshToken: tokens.refresh_token ?? null,
      providerTokenExpires: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      raw: payload,
    };
  },
};

export default googleProvider;
