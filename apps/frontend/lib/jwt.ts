// Utilitarios JWT centralizados (HS512, com fallback HS256 para compatibilidade)
import { SignJWT, jwtVerify } from 'jose';

type Role = "ADMIN" | "GESTOR" | "CLIENTE";
const JWT_SECRET: string = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '15m'; // Access token: 15 min

const secret = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  sub?: string;
  id: string;
  email: string;
  role: Role;
  nome: string;
  tokenVersion?: number;
  exp?: number;   // expiração (segundos) - padrão JWT
  [key: string]: any;
}

/** Gera token JWT com algoritmo HS512. */
export async function generateToken(payload: JWTPayload, expiresIn?: string): Promise<string> {
  const expiration = expiresIn || (JWT_EXPIRES_IN as string);
  const token = await new SignJWT({ ...payload } as any)
    .setProtectedHeader({ alg: 'HS512' })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(secret);

  return token;
}

/**
 * Verifica e decodifica um token JWT. Aceita HS512 (novo) e HS256 (compatibilidade).
 */
export async function validateAccessToken(token: string): Promise<JWTPayload | null> {
  for (const alg of ['HS512', 'HS256'] as const) {
    try {
      const { payload } = await jwtVerify(token, secret, { algorithms: [alg] });
      return payload as JWTPayload;
    } catch {
      continue;
    }
  }
  return null;
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
    // Padrão: 7 dias
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  
  const value = parseInt(match[1]);
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

