/**
 * Middleware checkTokenVersion - Camada API (Express)
 * Compara tokenVersion do JWT (em req.jwtPayload) com o banco (tabela usuarios).
 * Rejeita 401 se divergente (revogação após logout).
 * Requer validateJWT antes (req.jwtPayload) e dbMiddleware (req.db).
 * Rotas públicas (login/register) passam sem checagem.
 */

const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/users/login', '/users/register'];

/**
 * @param {import('express').Request} req - req.jwtPayload (validateJWT), req.db (dbMiddleware)
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function checkTokenVersion(req, res, next) {
  if (PUBLIC_PATHS.some((p) => req.path === p)) {
    return next();
  }

  const payload = req.jwtPayload;
  if (!payload) {
    return res.status(401).json({ error: 'Token not validated' });
  }

  const userId = payload.id ?? payload.sub;
  const tokenVersion = payload.tokenVersion ?? 0;

  const db = req.db;
  if (!db || typeof db.query !== 'function') {
    console.error('checkTokenVersion: req.db não disponível');
    return res.status(500).json({ error: 'Internal authentication error' });
  }

  try {
    const result = await db.query(
      'SELECT id, token_version AS "tokenVersion", role FROM usuarios WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const dbVersion = user.tokenVersion ?? 0;
    if (dbVersion !== tokenVersion) {
      return res.status(401).json({ error: 'Token revoked' });
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: payload.email ?? null,
      nome: payload.nome ?? null,
    };

    next();
  } catch (err) {
    console.error('checkTokenVersion error:', err);
    return res.status(500).json({ error: 'Internal authentication error' });
  }
}

export default checkTokenVersion;
export { checkTokenVersion };
