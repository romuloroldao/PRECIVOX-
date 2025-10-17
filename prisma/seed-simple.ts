// Seed simplificado - Cria apenas usuários de teste
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Criando usuários de teste...');

  const senhaHash = await bcrypt.hash('senha123', 10);

  // Verifica se já existem usuários
  const existingAdmin = await prisma.usuarios.findUnique({
    where: { email: 'admin@precivox.com' }
  });

  if (!existingAdmin) {
    await prisma.usuarios.create({
      data: {
        id: `admin-${Date.now()}`,
        email: 'admin@precivox.com',
        nome: 'Administrador',
        senha_hash: senhaHash,
        role: 'ADMIN',
        data_atualizacao: new Date(),
      },
    });
    console.log('✅ Admin criado');
  } else {
    console.log('⏭️ Admin já existe');
  }

  const existingGestor = await prisma.usuarios.findUnique({
    where: { email: 'gestor@precivox.com' }
  });

  if (!existingGestor) {
    await prisma.usuarios.create({
      data: {
        id: `gestor-${Date.now()}`,
        email: 'gestor@precivox.com',
        nome: 'Gestor Teste',
        senha_hash: senhaHash,
        role: 'GESTOR',
        data_atualizacao: new Date(),
      },
    });
    console.log('✅ Gestor criado');
  } else {
    console.log('⏭️ Gestor já existe');
  }

  const existingCliente = await prisma.usuarios.findUnique({
    where: { email: 'cliente@precivox.com' }
  });

  if (!existingCliente) {
    await prisma.usuarios.create({
      data: {
        id: `cliente-${Date.now()}`,
        email: 'cliente@precivox.com',
        nome: 'Cliente Teste',
        senha_hash: senhaHash,
        role: 'CLIENTE',
        data_atualizacao: new Date(),
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

