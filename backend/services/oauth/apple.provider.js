/**
 * Sign in with Apple adapter.
 *
 * Particularidades tratadas:
 * - client_secret é um JWT ES256 assinado com a chave privada .p8 da Apple.
 * - Apple só envia nome/e-mail no PRIMEIRO consentimento (via form_post `user`);
 *   por isso aceitamos `profileName` vindo do BFF.
 * - Hide My Email (Private Relay): `is_private_email` indica relay; o e-mail relay
 *   é verificado/entregável, mas a chave de junção continua sendo o `sub`.
 *
 * Env necessários: APPLE_CLIENT_ID (Services ID), APPLE_TEAM_ID, APPLE_KEY_ID,
 *                  APPLE_PRIVATE_KEY (conteúdo do .p8, PEM PKCS8)
 */
import { createRemoteJWKSet, jwtVerify, importPKCS8, SignJWT } from 'jose';

const TOKEN_ENDPOINT = 'https://appleid.apple.com/auth/token';
const ISSUER = 'https://appleid.apple.com';
const JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

let cachedSecret = null; // { token, exp }

async function buildClientSecret() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedSecret && cachedSecret.exp - now > 300) {
    return cachedSecret.token;
  }

  const clientId = process.env.APPLE_CLIENT_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const rawKey = process.env.APPLE_PRIVATE_KEY;
  if (!clientId || !teamId || !keyId || !rawKey) {
    throw new Error('APPLE_CLIENT_ID/APPLE_TEAM_ID/APPLE_KEY_ID/APPLE_PRIVATE_KEY ausentes');
  }

  const pem = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
  const privateKey = await importPKCS8(pem, 'ES256');

  const exp = now + 60 * 60 * 24 * 180; // até 6 meses (limite da Apple)
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setAudience(ISSUER)
    .setSubject(clientId)
    .sign(privateKey);

  cachedSecret = { token, exp };
  return token;
}

export const appleProvider = {
  name: 'APPLE',

  async exchangeAndVerify({ code, codeVerifier, redirectUri, profileName }) {
    const clientId = process.env.APPLE_CLIENT_ID;
    if (!clientId) throw new Error('APPLE_CLIENT_ID ausente');

    const clientSecret = await buildClientSecret();

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
      throw new Error(`Falha na troca de code (Apple): ${tokens.error || res.status}`);
    }

    const { payload } = await jwtVerify(tokens.id_token, JWKS, {
      issuer: ISSUER,
      audience: clientId,
    });

    const isPrivateRelay =
      payload.is_private_email === true || payload.is_private_email === 'true';

    return {
      sub: String(payload.sub),
      email: payload.email ? String(payload.email).toLowerCase() : null,
      emailVerified: payload.email_verified === true || payload.email_verified === 'true',
      isPrivateRelay,
      name: profileName ?? null, // só vem no 1º consentimento
      avatar: null, // Apple não fornece avatar
      providerAccessToken: tokens.access_token ?? null,
      providerRefreshToken: tokens.refresh_token ?? null,
      providerTokenExpires: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      raw: payload,
    };
  },
};

export default appleProvider;
