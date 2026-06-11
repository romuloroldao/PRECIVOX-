#!/usr/bin/env tsx
/**
 * Backfill sku_nacional + embedding_json em produtos (Épico 15).
 * Uso: npm run db:backfill:sku-nacional [-- --take=500 --skip=0]
 */
import 'dotenv/config';
import { backfillSkuNacionalBatch } from '@/lib/sku-nacional/resolver';

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
  .finally(() => process.exit(0));
