// Seed simplificado - Cria apenas usuários de teste
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Criando usuários de teste...');

  const senhaHash = await bcrypt.hash('senha123', 10);

  // Verifica se já existem usuários
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@precivox.com' }
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        id: `admin-${Date.now()}`,
        email: 'admin@precivox.com',
        nome: 'Administrador',
        senhaHash: senhaHash,
        role: 'ADMIN',
        dataAtualizacao: new Date(),
      },
    });
    console.log('✅ Admin criado');
  } else {
    console.log('⏭️ Admin já existe');
  }

  const existingGestor = await prisma.user.findUnique({
    where: { email: 'gestor@precivox.com' }
  });

  if (!existingGestor) {
    await prisma.user.create({
      data: {
        id: `gestor-${Date.now()}`,
        email: 'gestor@precivox.com',
        nome: 'Gestor Teste',
        senhaHash: senhaHash,
        role: 'GESTOR',
        dataAtualizacao: new Date(),
      },
    });
    console.log('✅ Gestor criado');
  } else {
    console.log('⏭️ Gestor já existe');
  }

  const existingCliente = await prisma.user.findUnique({
    where: { email: 'cliente@precivox.com' }
  });

  if (!existingCliente) {
    await prisma.user.create({
      data: {
        id: `cliente-${Date.now()}`,
        email: 'cliente@precivox.com',
        nome: 'Cliente Teste',
        senhaHash: senhaHash,
        role: 'CLIENTE',
        dataAtualizacao: new Date(),
      },
    });
    console.log('✅ Cliente criado');
  } else {
    console.log('⏭️ Cliente já existe');
  }

  console.log('\n🎉 Usuários de teste criados!');
  console.log('\n🔑 Credenciais:');
  console.log('   Admin:   admin@precivox.com / senha123');
  console.log('   Gestor:  gestor@precivox.com / senha123');
  console.log('   Cliente: cliente@precivox.com / senha123');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

