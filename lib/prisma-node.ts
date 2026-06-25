/**
 * Cliente Prisma para scripts CLI, scheduler e jobs fora do bundle Next.
 * Evita `server-only`, que bloqueia import via tsx.
 */
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaNode: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaNode ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaNode = prisma;
}
