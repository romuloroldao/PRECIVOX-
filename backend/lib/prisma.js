/**
 * Prisma Client singleton para o backend Express (Node.js).
 *
 * IMPORTANTE (Arquitetura v7.0): o Prisma roda exclusivamente em Node.js
 * (proibido Edge). Este singleton evita esgotar o pool em hot-reload (tsx watch).
 *
 * Os modelos legados do backend usam `pg` cru (config/database.js). O fluxo de
 * autenticação social/OTP usa Prisma para respeitar o contrato canônico v7.0.
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__precivoxPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__precivoxPrisma = prisma;
}

export default prisma;
