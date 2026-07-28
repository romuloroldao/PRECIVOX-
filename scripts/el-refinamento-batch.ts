/**
 * Cron semanal: refina EL com base em eventos el_sugestao_resposta.
 * Uso: npx tsx scripts/el-refinamento-batch.ts
 */
import { refinarElConfigBatch } from '../lib/el-refinamento';

async function main() {
  const limit = parseInt(process.env.EL_REFINAMENTO_LIMIT || '500', 10);
  const { processados, ajustados } = await refinarElConfigBatch(limit);
  console.log(`[el-refinamento-batch] processados=${processados} ajustados=${ajustados}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
