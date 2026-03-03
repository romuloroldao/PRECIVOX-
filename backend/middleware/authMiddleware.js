/**
 * Middleware de autenticação JWT para Express - Auth v2
 *
 * - Valida assinatura e expiração do JWT
 * - Busca usuário no banco (tabela usuarios = mesma do Next/Prisma)
 * - Confere tokenVersion (revogação após logout)
 * - Injeta req.user real
 *
 * Pré-requisito: JWT_SECRET igual ao do Next. Payload deve conter id (ou sub) e tokenVersion.
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

/**
 * @param {import('express').Request} req - req.db deve existir (dbMiddleware)
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing token' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Missing token' });
    }

    if (!JWT_SECRET) {
      console.error('Auth middleware: JWT_SECRET não definido');
      return res.status(500).json({ error: 'Internal authentication error' });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Next emite JWT com "id"; padrão OAuth usa "sub"
    const userId = payload.sub ?? payload.id;
    const tokenVersion = typeof payload.tokenVersion === 'number' ? payload.tokenVersion : 0;

    if (!userId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Tabela usuarios (Prisma/Next). Se seu backend usar só "users", altere para: FROM users
    const db = req.db;
    if (!db || typeof db.query !== 'function') {
      console.error('Auth middleware: req.db não disponível (dbMiddleware deve rodar antes)');
      return res.status(500).json({ error: 'Internal authentication error' });
    }

    const result = await db.query(
      'SELECT id, token_version AS "tokenVersion", role FROM usuarios WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Revogação: tokenVersion no JWT deve bater com o do banco (incrementado no logout)
    const dbVersion = user.tokenVersion ?? 0;
    if (dbVersion !== tokenVersion) {
      return res.status(401).json({ error: 'Token revoked' });
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: payload.email || null,
      nome: payload.nome || null,
    };

    req.sessionId = null; // JWT não tem session id; rotas que precisam podem ignorar

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Internal authentication error' });
  }
}

export { authenticate };

/**
 * Autenticação opcional: se houver Bearer válido, preenche req.user; senão segue sem 401.
 */
async function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  if (!token || !JWT_SECRET) {
    return next();
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = payload.sub ?? payload.id;
    const tokenVersion = typeof payload.tokenVersion === 'number' ? payload.tokenVersion : 0;
    if (!userId) return next();
    const db = req.db;
    if (!db || typeof db.query !== 'function') return next();
    const result = await db.query(
      'SELECT id, token_version AS "tokenVersion", role FROM usuarios WHERE id = $1',
      [userId]
    );
    const user = result.rows[0];
    if (!user || (user.tokenVersion ?? 0) !== tokenVersion) return next();
    req.user = { id: user.id, role: user.role, email: payload.email || null, nome: payload.nome || null };
    next();
  } catch {
    next();
  }
}

export { optionalAuthenticate };
