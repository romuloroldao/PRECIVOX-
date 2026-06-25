import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { SEED_V3_PREFIX } from './config';

async function main() {
  const prisma = new PrismaClient();
  console.log(`Removendo dados ${SEED_V3_PREFIX}...`);

  const mercadoIds = (
    await prisma.mercados.findMany({
      where: { id: { startsWith: SEED_V3_PREFIX } },
      select: { id: true },
    })
  ).map((m) => m.id);

  if (mercadoIds.length) {
    await prisma.estoques.deleteMany({
      where: { unidades: { mercadoId: { in: mercadoIds } } },
    });
    await prisma.produtos.deleteMany({
      where: { OR: [{ id: { startsWith: SEED_V3_PREFIX } }, { mercadoId: { in: mercadoIds } }] },
    });
    await prisma.unidades.deleteMany({ where: { mercadoId: { in: mercadoIds } } });
    await prisma.mercados.deleteMany({ where: { id: { in: mercadoIds } } });
  }

  await prisma.user.deleteMany({ where: { email: 'gestor-v3@precivox-seed.com' } });

  console.log('Rollback v3 concluído.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
