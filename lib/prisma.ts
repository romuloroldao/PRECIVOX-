// Cliente Prisma Singleton
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
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

// Middleware para timeout nas queries
prisma.$use(async (params, next) => {
  const timeout = 8000; // 8 segundos de timeout
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Query timeout')), timeout);
  });

  try {
    const result = await Promise.race([
      next(params),
      timeoutPromise
    ]);
    return result;
  } catch (error) {
    console.error('Erro no Prisma middleware:', error);
    throw error;
  }
});

