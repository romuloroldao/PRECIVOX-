/**
 * Token Issuer — Backend Express (autoridade central de autenticação v7.0)
 *
 * Espelha packages/shared/auth-core/token-manager.ts:
 * - Access Token: JWT stateless HS512, 15 minutos.
 * - Refresh Token: string aleatória (32 bytes), salva como SHA-256 em refresh_tokens.
 * - Rotação suportada via refreshTokenPair().
 *
 * Usa o MESMO segredo (lib/jwt-secret.cjs) do Next.js, então os tokens emitidos aqui
 * são aceitos pelo middleware do Next (auth-core) e pelo validateJWT do backend.
 */
import './webcrypto-polyfill.js';
import crypto, { webcrypto } from 'crypto';
import { SignJWT } from 'jose';
import { getJwtSecret } from './jwt-secret-loader.js';
import { prisma } from './prisma.js';

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 7;

let hmacKeyPromise = null;

/** CryptoKey evita o caminho Uint8Array do jose webapi (usa `crypto` livre). */
function getHmacKey() {
  if (!hmacKeyPromise) {
    hmacKeyPromise = webcrypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(getJwtSecret()),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign', 'verify']
    );
  }
  return hmacKeyPromise;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateRefreshToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Gera o Access Token (JWT HS512, 15 min) com claims canônicos.
 * @param {{ id: string, email: string, role: string, nome?: string|null, tokenVersion?: number }} user
 */
async function signAccessToken(user) {
  const key = await getHmacKey();
  return new SignJWT({
    sub: user.id,
    id: user.id,
    email: user.email,
    role: user.role,
    nome: user.nome ?? null,
    tokenVersion: user.tokenVersion ?? 0,
  })
    .setProtectedHeader({ alg: 'HS512' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
    .sign(key);
}

/**
 * Emite o par Access + Refresh e persiste o hash do refresh em refresh_tokens.
 * @param {{ id: string, email: string, role: string, nome?: string|null, tokenVersion?: number }} user
 * @param {{ ip?: string, userAgent?: string }} [ctx]
 * @returns {Promise<{ accessToken: string, refreshToken: string, expiresAt: Date }>}
 */
export async function issueTokenPair(user, ctx = {}) {
  const accessToken = await signAccessToken(user);
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);

  await prisma.refreshToken.create({
    data: {
      id: crypto.randomUUID(),
      tokenHash: refreshTokenHash,
      userId: user.id,
      expiresAt,
      revoked: false,
      userAgent: ctx.userAgent ?? undefined,
      ipAddress: ctx.ip ?? undefined,
    },
  });

  return { accessToken, refreshToken, expiresAt };
}

export default { issueTokenPair };
