/**
 * Seed do Banco de Dados
 *
 * Cria/atualiza usuários de teste para cenários:
 * - Admin: admin@precivox.com / senha123
 * - Gestor: gestor@precivox.com / senha123
 * - Cliente: cliente@precivox.com / senha123
 *
 * Idempotente: pode ser executado múltiplas vezes sem duplicar dados.
 * Sempre revalida senha e emailVerified para permitir login.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  console.error('❌ Defina DATABASE_URL no arquivo .env na raiz do projeto e execute novamente: npm run db:seed');
  process.exit(1);
}

const prisma = new PrismaClient();

const TEST_USERS = [
  { email: 'admin@precivox.com', nome: 'Administrador', role: 'ADMIN' as const },
  { email: 'gestor@precivox.com', nome: 'Gestor', role: 'GESTOR' as const },
  { email: 'cliente@precivox.com', nome: 'Cliente', role: 'CLIENTE' as const },
];

const PASSWORD = 'senha123';

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  const hashedPassword = await bcrypt.hash(PASSWORD, 12);
  const now = new Date();

  for (const u of TEST_USERS) {
    const existing = await prisma.user.findUnique({
      where: { email: u.email },
    });

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
      console.log(`✅ Usuário atualizado: ${u.email} (${u.role})`);
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
      console.log(`✅ Usuário criado: ${u.email} (${u.role})`);
    }
  }

  console.log('');
  console.log('📋 Credenciais de teste (login com e-mail e senha):');
  console.log('   Admin:   admin@precivox.com   / senha123');
  console.log('   Gestor:  gestor@precivox.com  / senha123');
  console.log('   Cliente: cliente@precivox.com / senha123');
  console.log('');
  console.log('✅ Seed concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
