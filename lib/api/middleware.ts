/**
 * Middleware para Rate Limiting e Cache
 * Squad B - PRECIVOX API
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================
// Rate Limiting (In-Memory)
// ============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate Limiter simples em memória
 * Em produção, usar Redis
 */
export function rateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
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
    };
    rateLimitStore.set(key, entry);
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
  };
}

/**
 * Middleware de Rate Limiting para Next.js API Routes
 */
export function withRateLimit(
  maxRequests: number,
  windowMs: number,
  getIdentifier: (req: NextRequest) => string
) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return async (req: NextRequest) => {
      const identifier = getIdentifier(req);
      const limit = rateLimit(identifier, maxRequests, windowMs);
      
      if (!limit.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: 'Rate limit exceeded',
            message: `Too many requests. Try again after ${new Date(limit.resetAt).toISOString()}`,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': limit.remaining.toString(),
              'X-RateLimit-Reset': limit.resetAt.toString(),
              'Retry-After': Math.ceil((limit.resetAt - Date.now()) / 1000).toString(),
            },
          }
        );
      }
      
      const response = await handler(req);
      
      // Adicionar headers de rate limit
      response.headers.set('X-RateLimit-Limit', maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', limit.remaining.toString());
      response.headers.set('X-RateLimit-Reset', limit.resetAt.toString());
      
      return response;
    };
  };
}

/**
 * Helper para obter identificador do cliente
 */
export function getClientIdentifier(req: NextRequest): string {
  // Prioridade: IP > User ID > 'anonymous'
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
  
  // Se tiver autenticação, usar userId
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    // Em produção, extrair userId do JWT
    // Por enquanto, usar IP
    return `ip:${ip}`;
  }
  
  return `ip:${ip}`;
}

// ============================================
// Cache (In-Memory com TTL)
// ============================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cacheStore = new Map<string, CacheEntry<any>>();

/**
 * Cache simples em memória com TTL
 * Em produção, usar Redis
 */
export function getCache<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  
  if (!entry) {
    return null;
  }
  
  // Verificar expiração
  if (entry.expiresAt < Date.now()) {
    cacheStore.delete(key);
    return null;
  }
  
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttlMs: number): void {
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

export function clearCache(key?: string): void {
  if (key) {
    cacheStore.delete(key);
  } else {
    cacheStore.clear();
  }
}

/**
 * Helper para gerar chave de cache
 */
export function getCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return `${prefix}:${sortedParams}`;
}

/**
 * Limpar cache expirado periodicamente
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cacheStore.entries()) {
      if (entry.expiresAt < now) {
        cacheStore.delete(key);
      }
    }
  }, 60000); // Limpar a cada minuto
}

