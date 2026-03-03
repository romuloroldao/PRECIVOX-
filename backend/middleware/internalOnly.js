/**
 * Middleware internal-only: Express (3001) deve ser acessado apenas pelo Next.js (3000).
 * Rejeita qualquer requisição sem o header x-internal-secret igual a INTERNAL_API_SECRET.
 */

function internalOnly(req, res, next) {
  const secret = req.headers['x-internal-secret'];

  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    return res.status(403).json({ error: 'Forbidden - internal access only' });
  }

  next();
}

export default internalOnly;
export { internalOnly };
