/**
 * Middleware de autorização por role - usar após authenticate
 *
 * Uso:
 *   router.delete('/admin-only', authenticate, requireRole('ADMIN'), handler)
 *   router.get('/gestor', authenticate, requireRole('GESTOR'), handler)
 *
 * Aceita role em maiúsculo ou minúsculo (ADMIN/admin).
 */

/**
 * @param {string} role - Role exigida (ex: 'ADMIN', 'GESTOR', 'CLIENTE' ou 'admin')
 * @returns {import('express').RequestHandler}
 */
function requireRole(role) {
  const normalizedRequired = (role || '').toUpperCase();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = (req.user.role || '').toUpperCase();
    if (userRole !== normalizedRequired) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

/**
 * Exige que o usuário tenha uma das roles permitidas
 * @param {string[]} allowedRoles - Ex: ['ADMIN', 'GESTOR']
 */
function requireAnyRole(allowedRoles) {
  const normalized = (allowedRoles || []).map((r) => String(r).toUpperCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = (req.user.role || '').toUpperCase();
    if (!normalized.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

export { requireRole, requireAnyRole };
