// Utilitários JWT - Compatível com Edge Runtime
import { SignJWT, jwtVerify } from 'jose';
import { getJwtSecret } from '@/lib/jwt-secret';

type Role = 'ADMIN' | 'GESTOR' | 'CLIENTE';
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '15m';

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(getJwtSecret());
}

export interface JWTPayload {
  id: string;
  email: string;
  role: Role;
  nome: string;
  tokenVersion?: number;
  [key: string]: unknown;
}

/**
 * Gera um token JWT com os dados do usuário
 */
export async function generateToken(payload: JWTPayload, expiresIn?: string): Promise<string> {
  const expiration = expiresIn || (JWT_EXPIRES_IN as string);

  const token = await new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(getSecretKey());

  return token;
}

/**
 * Verifica e decodifica um token JWT
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Extrai o token do header Authorization
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Calcula a data de expiração baseada no tempo configurado
 */
export function getTokenExpiration(): Date {
  const expiresIn = String(JWT_EXPIRES_IN);
  const match = expiresIn.match(/^(\d+)([dhms])$/);

  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  let milliseconds = 0;
  switch (unit) {
    case 'd':
      milliseconds = value * 24 * 60 * 60 * 1000;
      break;
    case 'h':
      milliseconds = value * 60 * 60 * 1000;
      break;
    case 'm':
      milliseconds = value * 60 * 1000;
      break;
    case 's':
      milliseconds = value * 1000;
      break;
  }

  return new Date(Date.now() + milliseconds);
}
