/**
 * Middleware validateJWT - Camada API (Express)
 * Responsável por:
 * - Validar assinatura do JWT
 * - Validar expiração
 * - Extrair claims
 * Rejeita 401 se inválido.
 * Não acessa banco; apenas verifica e anexa req.jwtPayload.
 * Rotas públicas (login/register) passam sem token.
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/users/login', '/users/register'];

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validateJWT(req, res, next) {
  if (PUBLIC_PATHS.some((p) => req.path === p)) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = authHeader.slice(7);
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  if (!JWT_SECRET) {
    console.error('validateJWT: JWT_SECRET não definido');
    return res.status(500).json({ error: 'Internal authentication error' });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const userId = payload.sub ?? payload.id;
  if (!userId) {
    return res.status(401).json({ error: 'Invalid token payload' });
  }

  req.jwtPayload = {
    id: userId,
    sub: payload.sub,
    tokenVersion: typeof payload.tokenVersion === 'number' ? payload.tokenVersion : 0,
    email: payload.email ?? null,
    nome: payload.nome ?? payload.name ?? null,
    role: payload.role ?? null,
  };

  next();
}

export default validateJWT;
export { validateJWT };
