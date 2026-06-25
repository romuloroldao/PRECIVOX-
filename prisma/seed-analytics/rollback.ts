/**
 * Rollback do seed analítico Precivox v2
 *
 * Remove todos os registros com prefixo seed-v2- respeitando FKs.
 * NÃO afeta dados existentes fora do seed.
 *
 * Uso: npm run db:seed:analytics:rollback
 *      npm run db:seed:analytics:rollback -- --dry-run
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { SEED_PREFIX } from './config';

const dryRun = process.argv.includes('--dry-run');

async function countByPrefix(prisma: PrismaClient, model: string): Promise<number> {
  switch (model) {
    case 'npsResponse': return prisma.npsResponse.count({ where: { id: { startsWith: SEED_PREFIX } } });
    case 'userEvent': return prisma.userEvent.count({ where: { id: { startsWith: SEED_PREFIX } } });
    case 'alertas_ia': return prisma.alertas_ia.count({ where: { id: { startsWith: SEED_PREFIX } } });
    case 'analises_ia': return prisma.analises_ia.count({ where: { id: { startsWith: SEED_PREFIX } } });
    case 'acoes_gestor': return prisma.acoes_gestor.count({ where: { id: { startsWith: SEED_PREFIX } } });
    case 'metricas_dashboard': return prisma.metricas_dashboard.count({ where: { id: { startsWith: SEED_PREFIX } } });
    case 'produtos_relacionados': return prisma.produtos_relacionados.count({ where: { id: { startsWith: SEED_PREFIX } } });
    case 'vendas': return prisma.vendas.count({ where: { id: { startsWith: SEED_PREFIX } } });
    case 'movimentacoes_estoque': return prisma.movimentacoes_estoque.count({ where: { id: { startsWith: SEED_PREFIX } } });
    case 'estoques': return prisma.estoques.count({ where: { id: { startsWith: SEED_PREFIX } } });
    case 'unidades': return prisma.unidades.count({ where: { id: { startsWith: SEED_PREFIX } } });
    case 'mercados': return prisma.mercados.count({ where: { id: { startsWith: SEED_PREFIX } } });
    case 'produtos': return prisma.produtos.count({ where: { id: { startsWith: SEED_PREFIX } } });
    case 'planos_de_pagamento': return prisma.planos_de_pagamento.count({ where: { id: { startsWith: SEED_PREFIX } } });
    case 'user': return prisma.user.count({ where: { id: { startsWith: SEED_PREFIX } } });
    default: return 0;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Defina DATABASE_URL');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  console.log(`${dryRun ? '🔍 DRY-RUN' : '🗑️'} Rollback seed prefixo: ${SEED_PREFIX}`);

  const ordem = [
    'npsResponse', 'userEvent', 'alertas_ia', 'analises_ia', 'acoes_gestor',
    'metricas_dashboard', 'produtos_relacionados', 'vendas', 'movimentacoes_estoque',
    'estoques', 'unidades', 'mercados', 'produtos', 'planos_de_pagamento', 'user',
  ] as const;

  let total = 0;
  for (const model of ordem) {
    const count = await countByPrefix(prisma, model);
    if (count > 0) {
      console.log(`  ${model}: ${count} registros`);
      total += count;
    }
  }

  if (total === 0) {
    console.log('✅ Nenhum registro seed encontrado.');
    await prisma.$disconnect();
    return;
  }

  console.log(`\nTotal a remover: ${total} registros`);

  if (dryRun) {
    console.log('✅ Dry-run concluído — nenhum dado removido.');
    await prisma.$disconnect();
    return;
  }

  console.log('\nRemovendo em transação...');

  await prisma.$transaction(async (tx) => {
    await tx.npsResponse.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
    await tx.userEvent.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
    await tx.alertas_ia.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
    await tx.analises_ia.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
    await tx.acoes_gestor.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
    await tx.metricas_dashboard.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
    await tx.produtos_relacionados.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
    await tx.vendas.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
    await tx.movimentacoes_estoque.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
    await tx.estoques.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
    await tx.unidades.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
    await tx.mercados.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
    await tx.produtos.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
    await tx.planos_de_pagamento.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
    await tx.user.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
  }, { timeout: 300000 });

  console.log(`✅ Rollback concluído — ${total} registros removidos.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Erro no rollback:', e);
  process.exit(1);
});
