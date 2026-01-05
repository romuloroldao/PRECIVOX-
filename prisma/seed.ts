/**
 * Seed do Banco de Dados
 * 
 * Cria usuário ADMIN padrão se não existir
 * Idempotente: pode ser executado múltiplas vezes sem duplicar dados
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Verificar se usuário ADMIN padrão já existe
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@precivox.com.br';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`✅ Usuário ADMIN já existe: ${adminEmail}`);
    
    // Atualizar senha se necessário (útil para reset em dev)
    if (process.env.FORCE_RESET_ADMIN_PASSWORD === 'true') {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          senhaHash: hashedPassword,
          role: 'ADMIN',
          dataAtualizacao: new Date(),
        },
      });
      console.log(`🔄 Senha do ADMIN resetada`);
    }
  } else {
    // Criar usuário ADMIN
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    const admin = await prisma.user.create({
      data: {
        id: `admin-${Date.now()}`,
        email: adminEmail,
        nome: 'Administrador',
        senhaHash: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
      },
    });

    console.log(`✅ Usuário ADMIN criado:`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Senha: ${adminPassword}`);
    console.log(`   ⚠️  IMPORTANTE: Altere a senha padrão em produção!`);
  }

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
