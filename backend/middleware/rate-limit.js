/**
 * Rate Limiting Middleware
 * Previne abuso das APIs limitando requisições por IP/usuário
 */

const rateLimit = new Map();

/**
 * Configuração de rate limiting
 */
const RATE_LIMIT_CONFIG = {
  // APIs de IA - mais restritivas
  ai: {
    windowMs: 60 * 1000, // 1 minuto
    max: 10, // 10 requisições por minuto
  },
  // APIs gerais
  general: {
    windowMs: 60 * 1000,
    max: 60, // 60 requisições por minuto
  },
  // APIs públicas
  public: {
    windowMs: 60 * 1000,
    max: 100,
  },
};

/**
 * Cria middleware de rate limiting
 */
function createRateLimiter(type = 'general') {
  const config = RATE_LIMIT_CONFIG[type] || RATE_LIMIT_CONFIG.general;

  return (req, res, next) => {
    // Identificador único (IP + userId se autenticado)
    const identifier = req.user?.id 
      ? `user:${req.user.id}` 
      : `ip:${req.ip || req.connection.remoteAddress}`;

    const key = `${type}:${identifier}`;
    const now = Date.now();

    // Obter ou criar registro de rate limit
    let record = rateLimit.get(key);

    if (!record) {
      record = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      rateLimit.set(key, record);
    }

    // Reset se a janela expirou
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + config.windowMs;
    }

    // Incrementar contador
    record.count++;

    // Headers de rate limit
    res.setHeader('X-RateLimit-Limit', config.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.max - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    // Verificar se excedeu o limite
    if (record.count > config.max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      
      return res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: `Limite de requisições excedido. Tente novamente em ${retryAfter} segundos.`,
        retryAfter,
      });
    }

    next();
  };
}

/**
 * Limpar registros antigos periodicamente (a cada 5 minutos)
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimit.entries()) {
    if (now > record.resetTime + 60000) { // 1 minuto após reset
      rateLimit.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const rateLimitAI = createRateLimiter('ai');
export const rateLimitGeneral = createRateLimiter('general');
export const rateLimitPublic = createRateLimiter('public');
