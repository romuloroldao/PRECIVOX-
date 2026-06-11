#!/usr/bin/env tsx
/**
 * Backfill sku_nacional + embedding_json em produtos (Épico 15).
 * Uso: npm run db:backfill:sku-nacional [-- --take=500 --skip=0]
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { computeCamposChaveProduto } from '@/lib/produtos-chaves';

const prisma = new PrismaClient();

async function backfillSkuNacionalBatch(opts?: { take?: number; skip?: number }) {
  const take = Math.min(opts?.take ?? 500, 2000);
  const skip = opts?.skip ?? 0;

  const rows = await prisma.produtos.findMany({
    skip,
    take,
    orderBy: { id: 'asc' },
    select: {
      id: true,
      nome: true,
      codigoBarras: true,
      marca: true,
      categoria: true,
    },
  });

  for (const p of rows) {
    const campos = computeCamposChaveProduto({
      nome: p.nome,
      codigoBarras: p.codigoBarras,
      marca: p.marca,
      categoria: p.categoria,
    });
    await prisma.produtos.update({
      where: { id: p.id },
      data: {
        nomeChave: campos.nomeChave,
        chaveInsight: campos.chaveInsight,
        skuNacional: campos.skuNacional,
        embeddingJson: campos.embeddingJson,
        dataAtualizacao: new Date(),
      },
    });
  }

  const restantes = await prisma.produtos.count({
    where: { OR: [{ skuNacional: null }, { skuNacional: '' }] },
  });

  return { processados: rows.length, restantes };
}

async function main() {
  const args = process.argv.slice(2);
  const take = parseInt(args.find((a) => a.startsWith('--take='))?.split('=')[1] || '1000', 10);
  const skip = parseInt(args.find((a) => a.startsWith('--skip='))?.split('=')[1] || '0', 10);

  console.log(`Backfill SKU nacional: take=${take} skip=${skip}`);
  const { processados, restantes } = await backfillSkuNacionalBatch({ take, skip });
  console.log(`Processados: ${processados} · Sem SKU ainda: ~${restantes}`);
  if (restantes > 0) {
    console.log(`Próximo lote: npm run db:backfill:sku-nacional -- --take=${take} --skip=${skip + processados}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
