/**
 * Script one-off: enfileira e processa imagens de produtos em lotes.
 *
 * Uso:
 *   npx tsx scripts/backfill-produto-imagens.ts           # enfileira até 500
 *   npx tsx scripts/backfill-produto-imagens.ts --process # processa um lote
 *   npx tsx scripts/backfill-produto-imagens.ts --all     # enfileira + processa em loop
 */
import 'dotenv/config';
import {
  enfileirarProdutosSemImagem,
  runProductImageBackfill,
} from '../lib/imagens/produto-imagem-service';

const args = process.argv.slice(2);
const shouldEnqueue = args.includes('--enqueue') || args.includes('--all') || args.length === 0;
const shouldProcess = args.includes('--process') || args.includes('--all');
const limit = parseInt(
  args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '500',
  10
);
const batches = parseInt(
  args.find((a) => a.startsWith('--batches='))?.split('=')[1] || '10',
  10
);

async function main() {
  if (shouldEnqueue) {
    const enfileirados = await enfileirarProdutosSemImagem(limit);
    console.log(`✅ ${enfileirados} produtos enfileirados como PENDENTE`);
  }

  if (shouldProcess) {
    let totalProcessados = 0;
    let totalAutomatica = 0;
    let totalInvalida = 0;

    for (let i = 0; i < batches; i++) {
      const resumo = await runProductImageBackfill();
      totalProcessados += resumo.processados;
      totalAutomatica += resumo.automatica;
      totalInvalida += resumo.invalida;

      console.log(
        `Lote ${i + 1}: ${resumo.processados} processados (${resumo.automatica} ok, ${resumo.invalida} inválidos)`
      );

      if (resumo.processados === 0) break;
    }

    console.log(
      `\n📊 Total: ${totalProcessados} processados, ${totalAutomatica} automáticas, ${totalInvalida} inválidas`
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erro:', err);
    process.exit(1);
  });
