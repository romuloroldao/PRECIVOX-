/**
 * Rate Limiter Middleware
 * 
 * SQUAD B - Backend
 * 
 * Implementa rate limiting com sliding window
 * Suporta in-memory store (pronto para migrar para Redis)
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================
// Types
// ============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
  windowStart: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier?: (req: NextRequest) => string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

// ============================================
// In-Memory Store
// ============================================

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Limpar entradas expiradas periodicamente
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000); // Limpar a cada minuto
}

// ============================================
// Rate Limiting Logic
// ============================================

/**
 * Sliding Window Rate Limiter
 * 
 * Implementa algoritmo de janela deslizante para rate limiting
 * 
 * @export Para uso direto em handlers quando necessário
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  
  let entry = rateLimitStore.get(key);
  
  // Limpar entrada expirada
  if (entry && entry.resetAt < now) {
    rateLimitStore.delete(key);
    entry = undefined;
  }
  
  // Criar nova entrada se não existir
  if (!entry) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
      windowStart: now,
    };
    rateLimitStore.set(key, entry);
  }
  
  // Verificar se janela deslizou
  const windowElapsed = now - entry.windowStart;
  if (windowElapsed >= windowMs) {
    // Resetar janela
    entry.count = 0;
    entry.windowStart = now;
    entry.resetAt = now + windowMs;
  }
  
  // Incrementar contador
  entry.count++;
  
  // Verificar limite
  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);
  
  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
    limit: maxRequests,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Obter identificador do cliente
 * Prioridade: IP > User ID (do token) > 'anonymous'
 */
export function getClientIdentifier(req: NextRequest): string {
  // Tentar extrair IP
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown';
  
  // TODO: Em produção, extrair userId do JWT token
  // const authHeader = req.headers.get('authorization');
  // if (authHeader) {
  //   const userId = extractUserIdFromToken(authHeader);
  //   if (userId) {
  //     return `user:${userId}`;
  //   }
  // }
  
  return `ip:${ip}`;
}

/**
 * Obter identificador por usuário (para rate limiting por usuário)
 */
export function getUserIdentifier(req: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  // Tentar extrair do body (para POST requests)
  // Por enquanto, usar IP
  return getClientIdentifier(req);
}

// ============================================
// Middleware
// ============================================

/**
 * Rate Limiter Middleware
 * 
 * @param config Configuração do rate limit
 * @returns Middleware function
 */
export function withRateLimit(
  config: RateLimitConfig
): (handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>) => 
    (req: NextRequest, ...args: any[]) => Promise<NextResponse> {
  
  const {
    maxRequests,
    windowMs,
    identifier = getClientIdentifier,
  } = config;
  
  return (handler) => {
    return async (req: NextRequest, ...args: any[]) => {
      // Obter identificador
      const id = identifier(req);
      
      // Verificar rate limit
      const limit = checkRateLimit(id, maxRequests, windowMs);
      
      // Se excedeu o limite, retornar erro 429
      if (!limit.allowed) {
        const retryAfter = Math.ceil((limit.resetAt - Date.now()) / 1000);
        
        return NextResponse.json(
          {
            success: false,
            error: 'Rate limit exceeded',
            message: `Too many requests. Try again after ${new Date(limit.resetAt).toISOString()}`,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': limit.resetAt.toString(),
              'Retry-After': retryAfter.toString(),
              'Content-Type': 'application/json',
            },
          }
        );
      }
      
      // Executar handler
      const response = await handler(req, ...args);
      
      // Adicionar headers de rate limit
      response.headers.set('X-RateLimit-Limit', limit.limit.toString());
      response.headers.set('X-RateLimit-Remaining', limit.remaining.toString());
      response.headers.set('X-RateLimit-Reset', limit.resetAt.toString());
      
      return response;
    };
  };
}

/**
 * Rate Limiter para endpoints específicos
 * 
 * Configurações pré-definidas conforme contratos
 */
export const rateLimiters = {
  // GET /api/stats/global: 100 req/min
  statsGlobal: withRateLimit({
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minuto
  }),
  
  // GET /api/products/popular: 60 req/min
  productsPopular: withRateLimit({
    maxRequests: 60,
    windowMs: 60 * 1000,
  }),
  
  // POST /api/lists/create: 10 req/min por usuário
  // Nota: Rate limiting por usuário é feito no handler (precisa ler body)
  listsCreate: withRateLimit({
    maxRequests: 10,
    windowMs: 60 * 1000,
    identifier: (req) => {
      // Por enquanto, usar IP
      // Rate limiting por userId é feito no handler após ler body
      return getClientIdentifier(req);
    },
  }),
  
  // GET /api/lists/:id: 60 req/min
  listsGet: withRateLimit({
    maxRequests: 60,
    windowMs: 60 * 1000,
  }),
  
  // POST /api/compare: 30 req/min
  compare: withRateLimit({
    maxRequests: 30,
    windowMs: 60 * 1000,
  }),
};

// ============================================
// Utility Functions
// ============================================

/**
 * Limpar rate limit store (útil para testes)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}

/**
 * Obter estatísticas de rate limit (útil para debug)
 */
export function getRateLimitStats(): {
  totalEntries: number;
  entries: Array<{ key: string; count: number; resetAt: number }>;
} {
  const entries = Array.from(rateLimitStore.entries()).map(([key, entry]) => ({
    key,
    count: entry.count,
    resetAt: entry.resetAt,
  }));
  
  return {
    totalEntries: entries.length,
    entries,
  };
}

