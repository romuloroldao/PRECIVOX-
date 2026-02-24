import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro';

export interface ValidatedAccessTokenPayload {
  sub: string;
  id: string;
  email: string;
  role: 'ADMIN' | 'GESTOR' | 'CLIENTE' | 'USUARIO';
  nome: string;
  exp: number;
  tokenVersion?: number;
}

function normalizeRole(role: unknown): ValidatedAccessTokenPayload['role'] {
  if (role === 'ADMIN' || role === 'GESTOR' || role === 'CLIENTE' || role === 'USUARIO') return role;
  return 'CLIENTE';
}

function assertPayload(payload: Record<string, unknown>): ValidatedAccessTokenPayload {
  const sub = typeof payload.sub === 'string' ? payload.sub : undefined;
  const id = typeof payload.id === 'string' ? payload.id : sub;
  const email = typeof payload.email === 'string' ? payload.email : '';
  const exp = typeof payload.exp === 'number' ? payload.exp : 0;

  if (!id || !exp) {
    throw new Error('Invalid access token payload');
  }

  return {
    sub: sub || id,
    id,
    email,
    role: normalizeRole(payload.role),
    nome: typeof payload.nome === 'string' ? payload.nome : '',
    exp,
    tokenVersion: typeof payload.tokenVersion === 'number' ? payload.tokenVersion : 0,
  };
}

export function validateAccessToken(token: string): ValidatedAccessTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
  return assertPayload(decoded);
}

