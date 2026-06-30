// NOTE: este módulo roda no servidor Express (Node/tsx), NÃO em React Server Components.
// Por isso NÃO importa 'server-only' (que lança erro fora do contexto RSC do Next.js).
import { PrismaClient } from '@prisma/client';

// Singleton pattern para Prisma Client
let prismaInstance: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prismaInstance = new PrismaClient();
} else {
  // Em desenvolvimento, reutilizar a instância global
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient();
  }
  prismaInstance = (global as any).prisma;
}

export const prisma = prismaInstance;

