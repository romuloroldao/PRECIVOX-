#!/usr/bin/env npx tsx
/**
 * Reativa produtos (ativo=true) que ainda possuem pelo menos uma linha em `estoques`.
 * Útil quando itens sumiram da busca do cliente por estarem inativos, mas o estoque ainda existe.
 *
 * Uso:
 *   npx tsx scripts/reativar-produtos-com-estoque.ts --dry-run   # só lista e conta
 *   npx tsx scripts/reativar-produtos-com-estoque.ts             # aplica
 *
 * Com DATABASE_URL explícita:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/reativar-produtos-com-estoque.ts --dry-run
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (!process.env.DATABASE_URL) {
    console.error('❌ Defina DATABASE_URL (arquivo .env ou variável de ambiente)');
    process.exit(1);
  }

  const where = {
    ativo: false,
    estoques: {
      some: {},
    },
  };

  const total = await prisma.produtos.count({ where });

  console.log('');
  console.log(dryRun ? '🔍 Modo --dry-run (nenhuma alteração será feita)' : '✏️  Aplicando atualizações');
  console.log(`📦 Produtos inativos com pelo menos um estoque: ${total}`);
  console.log('');

  if (dryRun && total > 0) {
    const amostra = await prisma.produtos.findMany({
      where,
      select: {
        id: true,
        nome: true,
        _count: { select: { estoques: true } },
      },
      orderBy: { nome: 'asc' },
      take: 50,
    });

    console.log('Primeiros exemplos:');
    for (const p of amostra) {
      console.log(`  - ${p.id} | ${(p.nome ?? '').slice(0, 60)} (${p._count.estoques} estoque(s))`);
    }
    if (total > amostra.length) {
      console.log(`  ... e mais ${total - amostra.length} registro(s).`);
    }
    console.log('');
    console.log('Para aplicar, rode sem --dry-run.');
    await prisma.$disconnect();
    return;
  }

  if (!dryRun && total === 0) {
    console.log('Nada a atualizar.');
    await prisma.$disconnect();
    return;
  }

  const agora = new Date();
  const resultado = await prisma.produtos.updateMany({
    where,
    data: {
      ativo: true,
      dataAtualizacao: agora,
    },
  });

  console.log(`✅ Produtos reativados: ${resultado.count}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Erro:', e);
  process.exit(1);
});
