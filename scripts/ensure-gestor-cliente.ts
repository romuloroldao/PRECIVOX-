#!/usr/bin/env npx tsx
/**
 * Cria ou atualiza apenas Gestor e Cliente com e-mail verificado.
 * Uso (no servidor ou com .env):
 *   npm run db:seed
 * ou só estes dois:
 *   npx tsx scripts/ensure-gestor-cliente.ts
 *   DATABASE_URL="postgresql://..." npx tsx scripts/ensure-gestor-cliente.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const USERS = [
  { email: 'gestor@precivox.com', nome: 'Gestor', role: 'GESTOR' as const },
  { email: 'cliente@precivox.com', nome: 'Cliente', role: 'CLIENTE' as const },
];
const PASSWORD = 'senha123';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Defina DATABASE_URL (arquivo .env ou variável de ambiente)');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(PASSWORD, 12);
  const now = new Date();

  for (const u of USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      await prisma.user.update({
        where: { email: u.email },
        data: {
          nome: u.nome,
          role: u.role,
          senhaHash: hashedPassword,
          emailVerified: now,
          dataAtualizacao: now,
        },
      });
      console.log(`✅ Atualizado: ${u.email} (${u.role}) — e-mail verificado`);
    } else {
      await prisma.user.create({
        data: {
          id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          email: u.email,
          nome: u.nome,
          role: u.role,
          senhaHash: hashedPassword,
          emailVerified: now,
          dataCriacao: now,
          dataAtualizacao: now,
        },
      });
      console.log(`✅ Criado: ${u.email} (${u.role}) — e-mail verificado`);
    }
  }

  console.log('\n📋 Login: gestor@precivox.com / cliente@precivox.com — senha: senha123');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
