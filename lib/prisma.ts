// Cliente Prisma Singleton
import 'server-only';
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
  // Flag para não registrar o middleware mais de uma vez no mesmo client
  // (hot reload em dev reavalia o módulo e reaproveita o singleton global).
  var __prismaMiddlewareRegistered: boolean | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

const QUERY_TIMEOUT_MS = 8000;

// Middleware de timeout — registrado UMA única vez por client.
// Sem o guard, cada hot reload empilhava um novo middleware no singleton,
// multiplicando logs de erro e timers por query.
if (!globalThis.__prismaMiddlewareRegistered) {
  prisma.$use(async (params, next) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`Query timeout (${params.model ?? '?'}.${params.action})`)),
        QUERY_TIMEOUT_MS
      );
    });

    try {
      return await Promise.race([next(params), timeoutPromise]);
    } finally {
      // Sempre limpar o timer — evita acúmulo de handles pendentes por 8s.
      if (timer) clearTimeout(timer);
    }
  });
  globalThis.__prismaMiddlewareRegistered = true;
}

