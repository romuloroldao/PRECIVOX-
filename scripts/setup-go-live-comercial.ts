#!/usr/bin/env tsx
/**
 * Setup go-live comercial — planos SaaS + parceiros âncora região piloto.
 * Uso: npm run db:setup:go-live
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CONTRATO_VERSAO = '2026-05-1';

const SAAS_TIER_FEATURES = {
  essencial: ['radar_demanda', 'pricing_assistido'],
  pro: [
    'radar_demanda',
    'pricing_assistido',
    'heatmap_intencao',
    'benchmark_regional',
    'ml_leve',
    'oferta_agregada',
    'promo_direcionada',
  ],
  enterprise: [
    'radar_demanda',
    'pricing_assistido',
    'heatmap_intencao',
    'benchmark_regional',
    'ml_leve',
    'oferta_agregada',
    'promo_direcionada',
    'cpg_insights',
  ],
} as const;

type SaasTier = keyof typeof SAAS_TIER_FEATURES;
type AncoraTipo = 'rede' | 'atacado' | 'atacarejo';

const PLANOS_SAAS: Array<{
  id: string;
  nome: string;
  descricao: string;
  valor: number;
  tier: SaasTier;
  limiteUnidades: number;
  limiteUploadMb: number;
}> = [
  {
    id: 'go-live-plano-essencial',
    nome: 'Essencial',
    descricao: 'Radar de demanda + pricing assistido',
    valor: 299,
    tier: 'essencial',
    limiteUnidades: 2,
    limiteUploadMb: 25,
  },
  {
    id: 'go-live-plano-pro',
    nome: 'Pro',
    descricao: 'Heatmap, benchmark, ML leve, oferta agregada e promo direcionada',
    valor: 799,
    tier: 'pro',
    limiteUnidades: 10,
    limiteUploadMb: 100,
  },
  {
    id: 'go-live-plano-enterprise',
    nome: 'Enterprise',
    descricao: 'Pro + insights CPG agregados (LGPD)',
    valor: 1999,
    tier: 'enterprise',
    limiteUnidades: 50,
    limiteUploadMb: 500,
  },
];

const MERCADO_PLANOS: Record<string, string> = {
  'seed-v2-mercado-0': 'go-live-plano-enterprise',
  'seed-v2-mercado-1': 'go-live-plano-pro',
  'seed-v2-mercado-2': 'go-live-plano-pro',
  'seed-v2-mercado-4': 'go-live-plano-essencial',
  'seed-v2-mercado-6': 'go-live-plano-pro',
  'mercado-1773686151364-1dbxuh': 'go-live-plano-pro',
};

const ANCORAS: Array<{
  mercadoId: string;
  tipo: AncoraTipo;
  prioridade: number;
  rotulo: string;
  tierMin: 2 | 3;
}> = [
  { mercadoId: 'seed-v2-mercado-0', tipo: 'rede', prioridade: 1, rotulo: 'Âncora Premium', tierMin: 2 },
  { mercadoId: 'seed-v2-mercado-1', tipo: 'atacarejo', prioridade: 2, rotulo: 'Âncora Atacarejo', tierMin: 2 },
  { mercadoId: 'seed-v2-mercado-6', tipo: 'atacarejo', prioridade: 3, rotulo: 'Atacado Regional', tierMin: 2 },
  { mercadoId: 'seed-v2-mercado-2', tipo: 'rede', prioridade: 4, rotulo: 'Varejo Bairro', tierMin: 2 },
  { mercadoId: 'seed-v2-mercado-11', tipo: 'atacarejo', prioridade: 5, rotulo: 'Desconto Popular', tierMin: 2 },
];

async function upsertPlanosSaas() {
  for (const p of PLANOS_SAAS) {
    const features = { tier: p.tier, features: [...SAAS_TIER_FEATURES[p.tier]] };
    await prisma.planos_de_pagamento.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        nome: p.nome,
        descricao: p.descricao,
        valor: p.valor,
        duracao: 30,
        limiteUnidades: p.limiteUnidades,
        limiteUploadMb: p.limiteUploadMb,
        limiteUsuarios: 10,
        ativo: true,
        features,
      },
      update: {
        nome: p.nome,
        descricao: p.descricao,
        valor: p.valor,
        limiteUnidades: p.limiteUnidades,
        limiteUploadMb: p.limiteUploadMb,
        ativo: true,
        features,
      },
    });
    console.log(`✅ Plano SaaS: ${p.nome} (R$ ${p.valor})`);
  }
}

async function vincularMercadosPlanos() {
  for (const [mercadoId, planoId] of Object.entries(MERCADO_PLANOS)) {
    const exists = await prisma.mercados.findUnique({ where: { id: mercadoId }, select: { id: true } });
    if (!exists) {
      console.warn(`⚠️  Mercado ${mercadoId} não encontrado — pulando plano`);
      continue;
    }
    await prisma.mercados.update({
      where: { id: mercadoId },
      data: { planoId, dataAtualizacao: new Date() },
    });
    console.log(`✅ Mercado ${mercadoId} → plano ${planoId}`);
  }
}

async function aceitarContrato(mercadoId: string, adminUserId: string, adminNome: string) {
  await prisma.mercados.update({
    where: { id: mercadoId },
    data: {
      parceiroSlaContrato: {
        versao: CONTRATO_VERSAO,
        aceitoEm: new Date().toISOString(),
        aceitoPorUserId: adminUserId,
        aceitoPorNome: adminNome,
      },
      dataAtualizacao: new Date(),
    },
  });
}

async function designarAncora(
  mercadoId: string,
  patch: { tipo: AncoraTipo; prioridade: number; rotulo: string },
  adminUserId: string
) {
  await prisma.mercados.update({
    where: { id: mercadoId },
    data: {
      parceiroAncora: {
        ativo: true,
        tipo: patch.tipo,
        regiaoModo: 'cep5',
        prioridade: patch.prioridade,
        rotulo: patch.rotulo,
        designadoEm: new Date().toISOString(),
        designadoPorUserId: adminUserId,
      },
      dataAtualizacao: new Date(),
    },
  });
}

async function prepararMercado(mercadoId: string, tierMin: 2 | 3, adminUserId: string, adminNome: string) {
  const mercado = await prisma.mercados.findUnique({
    where: { id: mercadoId },
    select: { parceiroTier: true, parceiroSlaContrato: true },
  });
  if (!mercado) return false;

  const tierAtual = Number(mercado.parceiroTier) || 1;
  if (tierAtual < tierMin) {
    await prisma.mercados.update({
      where: { id: mercadoId },
      data: { parceiroTier: tierMin, dataAtualizacao: new Date() },
    });
    console.log(`  ↑ Tier ${mercadoId}: ${tierAtual} → ${tierMin}`);
  }

  const contrato = mercado.parceiroSlaContrato as { versao?: string } | null;
  if (contrato?.versao !== CONTRATO_VERSAO) {
    await aceitarContrato(mercadoId, adminUserId, adminNome);
    console.log(`  ✓ Contrato SLA: ${mercadoId}`);
  }
  return true;
}

async function designarAncoras(adminUserId: string, adminNome: string) {
  for (const a of ANCORAS) {
    const ok = await prepararMercado(a.mercadoId, a.tierMin, adminUserId, adminNome);
    if (!ok) {
      console.warn(`⚠️  Mercado ${a.mercadoId} não encontrado`);
      continue;
    }
    await designarAncora(a.mercadoId, a, adminUserId);
    console.log(`✅ Âncora #${a.prioridade}: ${a.mercadoId} (${a.rotulo})`);
  }
}

async function main() {
  const admin = await prisma.user.findFirst({
    where: { email: { equals: 'admin@precivox.com', mode: 'insensitive' } },
    select: { id: true, nome: true },
  });
  if (!admin) throw new Error('admin@precivox.com não encontrado');

  console.log('>>> Setup go-live comercial PRECIVOX\n');
  await upsertPlanosSaas();
  await vincularMercadosPlanos();
  await designarAncoras(admin.id, admin.nome ?? 'Admin');

  const rows = await prisma.mercados.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, parceiroAncora: true },
  });
  const ativos = rows.filter((r) => {
    const cfg = r.parceiroAncora as { ativo?: boolean } | null;
    return cfg?.ativo === true;
  });
  console.log(`\n>>> ${ativos.length} parceiro(s) âncora ativo(s):`);
  for (const r of ativos) {
    const cfg = r.parceiroAncora as { prioridade?: number; rotulo?: string };
    console.log(`   - ${r.nome} (#${cfg.prioridade ?? '?'})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
