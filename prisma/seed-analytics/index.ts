/**
 * Seed Analítico Precivox v2
 *
 * Gera ambiente completo de dados fictícios para testes de:
 * - BI, IA, análises preditivas, performance e comportamento de mercado
 *
 * Uso:
 *   DATABASE_URL="..." npm run db:seed:analytics
 *   npm run db:seed:analytics:rollback
 *
 * Idempotente: usa prefixo seed-v2- e skipDuplicates.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

import { CONFIG, SEED_PREFIX, SEED_MARKER } from './config';
import { SeedLogger } from './lib/logger';
import { gerarCatalogoProdutos } from './generators/produtos';
import { criarPlanos, criarGestores, criarConsumidores, criarMercados } from './generators/entidades';
import { inserirProdutos, inserirEstoques, inserirMovimentacoes } from './generators/estoque';
import {
  inserirVendas,
  inserirDadosComportamentais,
  inserirMetricasDashboard,
  inserirAnalisesIA,
} from './generators/vendas-comportamento';

const REPORT_DIR = path.join(process.cwd(), 'prisma', 'seed-analytics', 'reports');

async function verificarAmbiente(): Promise<{ provider: string; tabelas: string[] }> {
  const prisma = new PrismaClient();
  try {
    const result = await prisma.$queryRaw<{ provider: string }[]>`
      SELECT current_database() as provider
    `;
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `;
    return {
      provider: `PostgreSQL (${result[0]?.provider ?? 'precivox'})`,
      tabelas: tables.map((t) => t.tablename),
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function verificarSeedExistente(prisma: PrismaClient): Promise<boolean> {
  const count = await prisma.mercados.count({
    where: { id: { startsWith: SEED_PREFIX } },
  });
  return count > 0;
}

async function gerarRelatorio(prisma: PrismaClient, logger: SeedLogger, runId: string) {
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

  const tabelas = [
    'mercados', 'unidades', 'produtos', 'estoques', 'vendas',
    'movimentacoes_estoque', 'usuarios', 'planos_de_pagamento',
    'user_events', 'metricas_dashboard', 'produtos_relacionados',
    'analises_ia', 'alertas_ia', 'nps_responses',
  ] as const;

  const contagens: Record<string, { total: number; seed: number }> = {};

  for (const t of tabelas) {
    let total = 0;
    let seed = 0;

    switch (t) {
      case 'mercados':
        total = await prisma.mercados.count();
        seed = await prisma.mercados.count({ where: { id: { startsWith: SEED_PREFIX } } });
        break;
      case 'unidades':
        total = await prisma.unidades.count();
        seed = await prisma.unidades.count({ where: { id: { startsWith: SEED_PREFIX } } });
        break;
      case 'produtos':
        total = await prisma.produtos.count();
        seed = await prisma.produtos.count({ where: { id: { startsWith: SEED_PREFIX } } });
        break;
      case 'estoques':
        total = await prisma.estoques.count();
        seed = await prisma.estoques.count({ where: { id: { startsWith: SEED_PREFIX } } });
        break;
      case 'vendas':
        total = await prisma.vendas.count();
        seed = await prisma.vendas.count({ where: { id: { startsWith: SEED_PREFIX } } });
        break;
      case 'movimentacoes_estoque':
        total = await prisma.movimentacoes_estoque.count();
        seed = await prisma.movimentacoes_estoque.count({ where: { id: { startsWith: SEED_PREFIX } } });
        break;
      case 'usuarios':
        total = await prisma.user.count();
        seed = await prisma.user.count({ where: { id: { startsWith: SEED_PREFIX } } });
        break;
      case 'planos_de_pagamento':
        total = await prisma.planos_de_pagamento.count();
        seed = await prisma.planos_de_pagamento.count({ where: { id: { startsWith: SEED_PREFIX } } });
        break;
      case 'user_events':
        total = await prisma.userEvent.count();
        seed = await prisma.userEvent.count({ where: { id: { startsWith: SEED_PREFIX } } });
        break;
      case 'metricas_dashboard':
        total = await prisma.metricas_dashboard.count();
        seed = await prisma.metricas_dashboard.count({ where: { id: { startsWith: SEED_PREFIX } } });
        break;
      case 'produtos_relacionados':
        total = await prisma.produtos_relacionados.count();
        seed = await prisma.produtos_relacionados.count({ where: { id: { startsWith: SEED_PREFIX } } });
        break;
      case 'analises_ia':
        total = await prisma.analises_ia.count();
        seed = await prisma.analises_ia.count({ where: { id: { startsWith: SEED_PREFIX } } });
        break;
      case 'alertas_ia':
        total = await prisma.alertas_ia.count();
        seed = await prisma.alertas_ia.count({ where: { id: { startsWith: SEED_PREFIX } } });
        break;
      case 'nps_responses':
        total = await prisma.npsResponse.count();
        seed = await prisma.npsResponse.count({ where: { id: { startsWith: SEED_PREFIX } } });
        break;
    }
    contagens[t] = { total, seed };
  }

  // Integridade referencial
  const estoquesOrfaos = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM estoques e
    WHERE e.id LIKE ${SEED_PREFIX + '%'}
    AND NOT EXISTS (SELECT 1 FROM produtos p WHERE p.id = e."produtoId")
  `;
  const vendasOrfas = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM vendas v
    WHERE v.id LIKE ${SEED_PREFIX + '%'}
    AND NOT EXISTS (SELECT 1 FROM produtos p WHERE p.id = v."produtoId")
  `;

  const report = {
    marker: SEED_MARKER,
    runId,
    geradoEm: new Date().toISOString(),
    duracaoSegundos: logger.elapsed(),
    config: CONFIG,
    contagens,
    integridade: {
      estoquesOrfaos: Number(estoquesOrfaos[0]?.count ?? 0),
      vendasOrfas: Number(vendasOrfas[0]?.count ?? 0),
      ok: Number(estoquesOrfaos[0]?.count ?? 0) === 0 && Number(vendasOrfas[0]?.count ?? 0) === 0,
    },
  };

  const reportPath = path.join(REPORT_DIR, `report-${runId}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  logger.info('');
  logger.info('═══════════════════════════════════════════════════');
  logger.info('           RELATÓRIO ESTATÍSTICO DO SEED           ');
  logger.info('═══════════════════════════════════════════════════');
  for (const [tabela, { total, seed }] of Object.entries(contagens)) {
    logger.info(`  ${tabela.padEnd(25)} total: ${String(total).padStart(8)} | seed: ${String(seed).padStart(8)}`);
  }
  logger.info('───────────────────────────────────────────────────');
  logger.info(`  Integridade referencial: ${report.integridade.ok ? 'OK ✅' : 'FALHA ❌'}`);
  logger.info(`  Relatório salvo: ${reportPath}`);
  logger.info(`  Log salvo: ${logger.getLogPath()}`);
  logger.info(`  Duração: ${logger.elapsed()}s`);
  logger.info('═══════════════════════════════════════════════════');

  return report;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Defina DATABASE_URL no .env ou .env.production');
    process.exit(1);
  }

  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const logger = new SeedLogger(runId);
  const prisma = new PrismaClient();

  try {
    // Fase 0: Análise do ambiente
    logger.info('Fase 0: Analisando schema e banco de dados...');
    const ambiente = await verificarAmbiente();
    logger.info(`Banco detectado: ${ambiente.provider}`);
    logger.info(`Tabelas encontradas: ${ambiente.tabelas.length}`);

    const tabelasRequeridas = ['mercados', 'unidades', 'produtos', 'estoques', 'vendas', 'usuarios'];
    const faltando = tabelasRequeridas.filter((t) => !ambiente.tabelas.includes(t));
    if (faltando.length > 0) {
      throw new Error(`Tabelas ausentes: ${faltando.join(', ')}`);
    }
    logger.ok('Schema validado — todas as tabelas necessárias presentes');

    const seedExistente = await verificarSeedExistente(prisma);
    if (seedExistente) {
      logger.warn('Seed v2 já detectado — reexecução idempotente (skipDuplicates)');
    }

    // Plano resumido
    logger.info('');
    logger.info('PLANO DE EXECUÇÃO:');
    logger.info(`  • ${CONFIG.totalMercados} mercados (tenants) — 3 flagship + 9 leves`);
    logger.info(`  • ${CONFIG.gestores} gestores + ${CONFIG.consumidores} consumidores`);
    logger.info(`  • ~${CONFIG.produtosPorUnidadeFlagship} produtos/unidade (flagship)`);
    logger.info(`  • ${CONFIG.diasHistoricoVendas} dias de vendas + movimentações`);
    logger.info(`  • Dados comportamentais, métricas, IA e correlações`);
    logger.info('');

    const senhaHash = await bcrypt.hash(CONFIG.senhaPadrao, 12);

    // Fase 1: Entidades base
    logger.info('Fase 1: Criando planos, gestores, consumidores e mercados...');
    const planos = await criarPlanos(prisma, logger);
    const gestores = await criarGestores(prisma, logger, senhaHash);
    const consumidores = await criarConsumidores(prisma, logger, senhaHash);
    const mercados = await criarMercados(prisma, logger, gestores, planos);

    // Fase 2: Catálogo de produtos
    logger.info('Fase 2: Gerando catálogo de produtos...');
    const totalProdutos = CONFIG.produtosPorUnidadeFlagship + 500;
    const produtos = gerarCatalogoProdutos(totalProdutos);
    await inserirProdutos(prisma, produtos, logger);

    // Fase 3: Estoque e movimentações
    logger.info('Fase 3: Populando estoques e movimentações...');
    const estoqueIdMap = await inserirEstoques(prisma, mercados, produtos, logger);
    await inserirMovimentacoes(prisma, mercados, produtos, estoqueIdMap, logger);

    // Fase 4: Vendas e comportamento
    logger.info('Fase 4: Gerando histórico de vendas e dados comportamentais...');
    await inserirVendas(prisma, mercados, produtos, consumidores, logger);
    await inserirDadosComportamentais(prisma, mercados, produtos, consumidores, logger);

    // Fase 5: Métricas e IA
    logger.info('Fase 5: Métricas dashboard e análises IA...');
    await inserirMetricasDashboard(prisma, mercados, logger);
    await inserirAnalisesIA(prisma, mercados, produtos, gestores, logger);

    // Relatório final
    await gerarRelatorio(prisma, logger, runId);

    logger.ok(`Seed analítico concluído em ${logger.elapsed()}s`);
    logger.info('');
    logger.info('Credenciais seed:');
    logger.info(`  Gestores: *@precivox-seed.com / ${CONFIG.senhaPadrao}`);
    logger.info(`  Consumidores: consumidor1@precivox-seed.com ... consumidor${CONFIG.consumidores}@precivox-seed.com / ${CONFIG.senhaPadrao}`);
    logger.info('');
    logger.info('Rollback: npm run db:seed:analytics:rollback');

  } catch (err) {
    logger.error(`Falha no seed: ${err instanceof Error ? err.message : String(err)}`);
    if (err instanceof Error && err.stack) logger.error(err.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
