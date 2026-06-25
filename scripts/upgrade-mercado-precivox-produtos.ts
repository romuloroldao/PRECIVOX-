#!/usr/bin/env npx tsx
/**
 * Atualiza o mercado "precivox" para o padrão de 5500 produtos por unidade,
 * reutilizando o catálogo seed-v2-prod-* já existente no banco.
 *
 * Uso:
 *   DATABASE_URL="..." npx tsx scripts/upgrade-mercado-precivox-produtos.ts
 *   npx tsx scripts/upgrade-mercado-precivox-produtos.ts --dry-run
 */
import 'dotenv/config';
import { PrismaClient, EstoqueFonte } from '@prisma/client';
import { CONFIG } from '../prisma/seed-analytics/config';
import { chunk, randomInt, randomFloat, pick, addDays } from '../prisma/seed-analytics/lib/utils';

const MERCADO_ID = 'mercado-1773686151364-1dbxuh';
const TARGET_PRODUTOS = 5500;
const BATCH = CONFIG.batchSize;
const dryRun = process.argv.includes('--dry-run');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Defina DATABASE_URL');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const now = new Date();

  const mercado = await prisma.mercados.findFirst({
    where: { id: MERCADO_ID },
    include: { unidades: { where: { ativa: true } } },
  });

  if (!mercado) {
    console.error(`❌ Mercado ${MERCADO_ID} não encontrado`);
    process.exit(1);
  }

  if (mercado.unidades.length === 0) {
    console.error('❌ Mercado precivox sem unidades ativas');
    process.exit(1);
  }

  console.log(`📦 Mercado: ${mercado.nome} (${mercado.unidades.length} unidade(s))`);
  console.log(`🎯 Meta: ${TARGET_PRODUTOS} produtos/unidade (padrão flagship)`);

  const produtosSeed = await prisma.produtos.findMany({
    where: { id: { startsWith: 'seed-v2-prod-' } },
    orderBy: { id: 'asc' },
    take: TARGET_PRODUTOS,
    select: {
      id: true,
      categoriaABC: true,
      giroEstoqueMedio: true,
      scoreSazonalidade: true,
      margemContribuicao: true,
    },
  });

  if (produtosSeed.length < TARGET_PRODUTOS) {
    console.error(`❌ Catálogo seed insuficiente: ${produtosSeed.length}/${TARGET_PRODUTOS}. Execute npm run db:seed:analytics primeiro.`);
    process.exit(1);
  }

  console.log(`✅ ${produtosSeed.length} produtos seed disponíveis no catálogo global`);

  let totalCriados = 0;
  let totalRemovidos = 0;

  for (const unidade of mercado.unidades) {
    const estoquesAtuais = await prisma.estoques.findMany({
      where: { unidadeId: unidade.id },
      select: { id: true, produtoId: true },
    });

    const produtoIdsAtuais = new Set(estoquesAtuais.map((e) => e.produtoId));
    const produtoIdsAlvo = new Set(produtosSeed.map((p) => p.id));

    const faltantes = produtosSeed.filter((p) => !produtoIdsAtuais.has(p.id));
    const obsoletos = estoquesAtuais.filter((e) => !produtoIdsAlvo.has(e.produtoId));

    console.log(`\n🏪 Unidade: ${unidade.nome} (${unidade.id})`);
    console.log(`   Estoques atuais: ${estoquesAtuais.length}`);
    console.log(`   A adicionar: ${faltantes.length}`);
    console.log(`   A remover (fora do padrão): ${obsoletos.length}`);

    if (dryRun) continue;

    // Remove estoques legados fora do catálogo de 5500
    if (obsoletos.length > 0) {
      await prisma.movimentacoes_estoque.deleteMany({
        where: { estoqueId: { in: obsoletos.map((o) => o.id) } },
      });
      await prisma.vendas.deleteMany({
        where: { unidadeId: unidade.id, produtoId: { in: obsoletos.map((o) => o.produtoId) } },
      });
      const removidos = await prisma.estoques.deleteMany({
        where: { id: { in: obsoletos.map((o) => o.id) } },
      });
      totalRemovidos += removidos.count;
      console.log(`   🗑️  ${removidos.count} estoques legados removidos`);
    }

    // Insere estoques no padrão seed (preço, promoção, quantidade)
    const novosEstoques: Parameters<typeof prisma.estoques.createMany>[0]['data'] = [];

    for (const p of faltantes) {
      const precoBase = randomFloat(3, 89);
      const emPromo = Math.random() < 0.08;
      const preco = parseFloat(precoBase.toFixed(2));
      const precoPromo = emPromo ? parseFloat((preco * randomFloat(0.75, 0.92)).toFixed(2)) : null;
      const estoqueMin = p.categoriaABC === 'A' ? randomInt(30, 80) : p.categoriaABC === 'B' ? randomInt(15, 40) : randomInt(5, 20);

      novosEstoques.push({
        id: `precivox-upg-est-${unidade.id.slice(-8)}-${p.id.slice(-8)}`,
        quantidade: randomInt(estoqueMin, estoqueMin * 8),
        preco,
        precoPromocional: precoPromo,
        emPromocao: emPromo,
        disponivel: true,
        atualizadoEm: addDays(now, -randomInt(0, 14)),
        fonte: pick([EstoqueFonte.UPLOAD_GESTOR, EstoqueFonte.API_PARCEIRO, EstoqueFonte.MANUAL_GESTOR]),
        confianca: randomInt(70, 98),
        verificadoEm: Math.random() > 0.3 ? addDays(now, -randomInt(1, 30)) : null,
        unidadeId: unidade.id,
        produtoId: p.id,
      });
    }

    for (const batch of chunk(novosEstoques, BATCH)) {
      const result = await prisma.estoques.createMany({ data: batch, skipDuplicates: true });
      totalCriados += result.count;
    }

    const finalCount = await prisma.estoques.count({ where: { unidadeId: unidade.id } });
    console.log(`   ✅ Estoques após upgrade: ${finalCount}`);
  }

  if (dryRun) {
    console.log('\n🔍 Dry-run — nenhuma alteração aplicada.');
    await prisma.$disconnect();
    return;
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`✅ Upgrade concluído`);
  console.log(`   Estoques criados: ${totalCriados}`);
  console.log(`   Estoques removidos: ${totalRemovidos}`);
  console.log('═══════════════════════════════════════');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Erro:', e);
  process.exit(1);
});
