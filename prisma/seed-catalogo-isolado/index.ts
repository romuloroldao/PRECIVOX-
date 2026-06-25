/**
 * Seed catálogo isolado v3 — N mercados × M produtos cada (SKUs exclusivos por mercado).
 *
 *   DATABASE_URL=... npm run db:seed:catalogo-isolado
 *   SEED_V3_MERCADOS=12 SEED_V3_PRODUTOS_POR_MERCADO=5500 npm run db:seed:catalogo-isolado
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';
import { CONFIG, NOMES_MERCADOS_V3, SEED_V3_PREFIX } from './config';
import { chunk, gerarProdutoIsolado, seedId } from './lib/utils';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL obrigatório');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const t0 = Date.now();
  const qtdMercados = Math.min(CONFIG.mercados, NOMES_MERCADOS_V3.length);

  console.log('══════════════════════════════════════════');
  console.log(' PRECIVOX — Seed catálogo isolado v3');
  console.log(` ${qtdMercados} mercados × ${CONFIG.produtosPorMercado} produtos`);
  console.log('══════════════════════════════════════════');

  const plano = await prisma.planos_de_pagamento.findFirst({ where: { ativo: true } });
  const planoId = plano?.id ?? null;

  const senhaHash = await bcrypt.hash(CONFIG.senhaGestor, 12);
  const gestorId = seedId('gestor-0');
  const now = new Date();
  await prisma.user.upsert({
    where: { email: 'gestor-v3@precivox-seed.com' },
    create: {
      id: gestorId,
      email: 'gestor-v3@precivox-seed.com',
      nome: 'Gestor Catálogo V3',
      senhaHash,
      role: Role.GESTOR,
      emailVerified: now,
      dataCriacao: now,
      dataAtualizacao: now,
    },
    update: { senhaHash, dataAtualizacao: now },
  });

  let totalProdutos = 0;
  let totalEstoques = 0;

  for (let mi = 0; mi < qtdMercados; mi++) {
    const mercadoId = seedId(`mercado-${mi}`);
    const nome = NOMES_MERCADOS_V3[mi];
    const cnpj = `99${String(mi).padStart(2, '0')}000000000${String(mi).padStart(2, '0')}`;

    await prisma.mercados.upsert({
      where: { id: mercadoId },
      create: {
        id: mercadoId,
        nome,
        cnpj,
        ativo: true,
        gestorId,
        planoId,
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
      },
      update: { nome, dataAtualizacao: new Date(), ativo: true },
    });

    const unidadeIds: string[] = [];
    for (let u = 0; u < CONFIG.unidadesPorMercado; u++) {
      const unidadeId = seedId(`unidade-m${mi}-u${u}`);
      unidadeIds.push(unidadeId);
      await prisma.unidades.upsert({
        where: { id: unidadeId },
        create: {
          id: unidadeId,
          mercadoId,
          nome: u === 0 ? 'Centro' : `Filial ${u + 1}`,
          cidade: 'São Paulo',
          estado: 'SP',
          endereco: `Rua Teste ${mi}-${u}`,
          ativa: true,
          dataCriacao: now,
          dataAtualizacao: now,
        },
        update: { ativa: true, dataAtualizacao: now },
      });
    }

    console.log(`\n▶ Mercado ${mi + 1}/${qtdMercados}: ${nome} (${CONFIG.produtosPorMercado} SKUs)`);

    for (let start = 1; start <= CONFIG.produtosPorMercado; start += CONFIG.batchSize) {
      const end = Math.min(start + CONFIG.batchSize - 1, CONFIG.produtosPorMercado);
      const produtosBatch = [];
      const estoquesBatch = [];

      for (let seq = start; seq <= end; seq++) {
        const p = gerarProdutoIsolado(mercadoId, mi, seq);
        const now = new Date();
        produtosBatch.push({
          id: p.id,
          mercadoId: p.mercadoId,
          nome: p.nome,
          descricao: p.descricao,
          categoria: p.categoria,
          codigoBarras: p.codigoBarras,
          marca: p.marca,
          unidadeMedida: p.unidadeMedida,
          ativo: true,
          dataCriacao: now,
          dataAtualizacao: now,
        });

        for (const unidadeId of unidadeIds) {
          estoquesBatch.push({
            id: seedId(`est-m${mi}-u${unidadeId.slice(-4)}-p${seq}`),
            unidadeId,
            produtoId: p.id,
            quantidade: 50 + (seq % 200),
            preco: p.preco,
            emPromocao: seq % 17 === 0,
            precoPromocional: seq % 17 === 0 ? parseFloat((p.preco * 0.85).toFixed(2)) : null,
            disponivel: true,
            atualizadoEm: now,
            dataCriacao: now,
          });
        }
      }

      const created = await prisma.produtos.createMany({ data: produtosBatch });
      if (created.count !== produtosBatch.length) {
        throw new Error(
          `Produtos: esperado ${produtosBatch.length}, inserido ${created.count} (mercado ${mi}, seq ${start}-${end})`,
        );
      }
      await prisma.estoques.createMany({ data: estoquesBatch, skipDuplicates: true });
      totalProdutos += produtosBatch.length;
      totalEstoques += estoquesBatch.length;

      if (end % (CONFIG.batchSize * 5) === 0 || end === CONFIG.produtosPorMercado) {
        process.stdout.write(`   … ${end}/${CONFIG.produtosPorMercado} produtos\r`);
      }
    }
    console.log(`   ✓ ${CONFIG.produtosPorMercado} produtos · ${CONFIG.produtosPorMercado * unidadeIds.length} estoques`);
  }

  const isolados = await prisma.produtos.count({
    where: { id: { startsWith: SEED_V3_PREFIX }, mercadoId: { not: null } },
  });

  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('\n══════════════════════════════════════════');
  console.log(` Concluído em ${sec}s`);
  console.log(` Produtos inseridos (aprox.): ${totalProdutos}`);
  console.log(` Estoques inseridos (aprox.): ${totalEstoques}`);
  console.log(` Produtos isolados no banco (prefixo ${SEED_V3_PREFIX}): ${isolados}`);
  console.log(' Gestor: gestor-v3@precivox-seed.com /', CONFIG.senhaGestor);
  console.log(' Rollback: npm run db:seed:catalogo-isolado:rollback');
  console.log('══════════════════════════════════════════');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
