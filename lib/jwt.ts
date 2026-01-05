// Utilitários JWT - Compatível com Edge Runtime
import { SignJWT, jwtVerify } from 'jose';

type Role = "ADMIN" | "GESTOR" | "CLIENTE";
const JWT_SECRET: string = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '15m'; // Access token: 15 minutos

// Converter string para Uint8Array para jose
const secret = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  id: string;
  email: string;
  role: Role;
  nome: string;
  [key: string]: any; // Para compatibilidade com jose
}

/**
 * Gera um token JWT com os dados do usuário
 * @param payload - Dados do usuário
 * @param expiresIn - Tempo de expiração (ex: '15m', '1h', '7d'). Se não fornecido, usa JWT_EXPIRES_IN
 */
export async function generateToken(payload: JWTPayload, expiresIn?: string): Promise<string> {
  const expiration = expiresIn || (JWT_EXPIRES_IN as string);
  
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(secret);
  
  return token;
}

/**
 * Verifica e decodifica um token JWT
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch (error) {
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

