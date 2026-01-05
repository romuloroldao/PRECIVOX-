/**
 * Redis Cache Helper
 * 
 * SQUAD B - Backend
 * 
 * Funções para cache usando Redis
 * Suporta fallback para in-memory se Redis não disponível
 */

import Redis from 'ioredis';

// Cliente Redis (singleton)
let redis: Redis | null = null;
let isRedisAvailable = false;

/**
 * Inicializar cliente Redis
 */
function getRedisClient(): Redis | null {
  if (redis) {
    return redis;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn('REDIS_URL não configurado, usando cache in-memory');
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.error('Redis connection failed after 3 retries');
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true; // Reconnect on READONLY error
        }
        return false;
      },
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected');
      isRedisAvailable = true;
    });

    redis.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
      isRedisAvailable = false;
    });

    redis.on('close', () => {
      console.warn('⚠️ Redis connection closed');
      isRedisAvailable = false;
    });

    return redis;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    return null;
  }
}

// Inicializar na importação
getRedisClient();

// Fallback: Cache in-memory
const memoryCache = new Map<string, { data: any; expiresAt: number }>();

/**
 * Obter dados do cache ou buscar e cachear
 * 
 * @param key Chave do cache
 * @param fetcher Função que busca dados se não estiver em cache
 * @param ttl Time to live em segundos (padrão: 5 minutos)
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  const client = getRedisClient();

  // Tentar Redis primeiro
  if (client && isRedisAvailable) {
    try {
      const cached = await client.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }

      // Buscar dados
      const data = await fetcher();

      // Salvar no cache
      await client.setex(key, ttl, JSON.stringify(data));

      return data;
    } catch (error) {
      console.error('Redis error, falling back to memory:', error);
      isRedisAvailable = false;
      // Continuar para fallback in-memory
    }
  }

  // Fallback: Cache in-memory
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  // Buscar dados
  const data = await fetcher();

  // Salvar no cache in-memory
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttl * 1000,
  });

  return data;
}

/**
 * Invalidar cache por chave
 */
export async function invalidate(key: string): Promise<void> {
  const client = getRedisClient();

  if (client && isRedisAvailable) {
    try {
      await client.del(key);
    } catch (error) {
      console.error('Error invalidating Redis cache:', error);
    }
  }

  // Invalidar cache in-memory também
  memoryCache.delete(key);
}

/**
 * Invalidar cache por padrão (wildcard)
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  const client = getRedisClient();

  if (client && isRedisAvailable) {
    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (error) {
      console.error('Error invalidating Redis cache pattern:', error);
    }
  }

  // Invalidar cache in-memory também
  const regex = new RegExp(pattern.replace('*', '.*'));
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Limpar todo o cache (útil para testes)
 */
export async function clearCache(): Promise<void> {
  const client = getRedisClient();

  if (client && isRedisAvailable) {
    try {
      await client.flushdb();
    } catch (error) {
      console.error('Error clearing Redis cache:', error);
    }
  }

  memoryCache.clear();
}

/**
 * Obter estatísticas do cache
 */
export async function getCacheStats(): Promise<{
  redisAvailable: boolean;
  redisKeys?: number;
  memoryKeys: number;
  hitRate?: number;
}> {
  const client = getRedisClient();
  const stats: any = {
    redisAvailable: isRedisAvailable && client !== null,
    memoryKeys: memoryCache.size,
  };

  if (client && isRedisAvailable) {
    try {
      const keys = await client.keys('*');
      stats.redisKeys = keys.length;
    } catch (error) {
      console.error('Error getting Redis stats:', error);
    }
  }

  return stats;
}

/**
 * Verificar se Redis está disponível
 */
export function isRedisConnected(): boolean {
  return isRedisAvailable && redis !== null;
}

/**
 * Fechar conexão Redis (útil para testes)
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    isRedisAvailable = false;
  }
}

// Limpar cache in-memory expirado periodicamente
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryCache.entries()) {
      if (entry.expiresAt < now) {
        memoryCache.delete(key);
      }
    }
  }, 60000); // Limpar a cada minuto
}

