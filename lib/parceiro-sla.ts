/**
 * SLA e contrato de dados do parceiro — Tier 1–3 (Épico 9.3)
 */

import { prisma } from '@/lib/prisma';
import type { SyncIntervalo } from '@/lib/sync-agendado';

export type ParceiroTier = 1 | 2 | 3;

export const CONTRATO_VERSAO_ATUAL = '2026-05-1';

export type ParceiroSlaContrato = {
  versao: string;
  aceitoEm: string;
  aceitoPorUserId: string;
  aceitoPorNome?: string;
};

export type TierDefinicao = {
  tier: ParceiroTier;
  nome: string;
  descricao: string;
  cadencia: string;
  diasStaleMax: number;
  intervalosSyncPermitidos: SyncIntervalo[];
  confiancaUpload: number;
  seloMercado: string | null;
  requisitos: string[];
};

export const TIER_DEFINICOES: Record<ParceiroTier, TierDefinicao> = {
  1: {
    tier: 1,
    nome: 'Manual',
    descricao: 'Upload ou sync semanal pelo gestor',
    cadencia: 'Até 7 dias entre atualizações',
    diasStaleMax: 7,
    intervalosSyncPermitidos: ['semanal', '24h'],
    confiancaUpload: 70,
    seloMercado: null,
    requisitos: [
      'Reimportar catálogo pelo menos 1× por semana ou em promoções relevantes',
      'Manter colunas obrigatórias do export PRECIVOX',
    ],
  },
  2: {
    tier: 2,
    nome: 'Diário',
    descricao: 'Sync automático diário (URL ou SFTP)',
    cadencia: 'Atualização a cada 24h ou menos',
    diasStaleMax: 2,
    intervalosSyncPermitidos: ['24h', '12h', '6h'],
    confiancaUpload: 85,
    seloMercado: 'Parceiro PRECIVOX',
    requisitos: [
      'Sync agendado ativo com intervalo ≤ 24h',
      'Arquivo no mesmo schema do upload manual',
      'Contato técnico para falhas de import',
    ],
  },
  3: {
    tier: 3,
    nome: 'API',
    descricao: 'Integração programática + webhook de preço',
    cadencia: 'Preços em tempo quase real via webhook ou batch',
    diasStaleMax: 1,
    intervalosSyncPermitidos: ['6h', '12h', '24h'],
    confiancaUpload: 90,
    seloMercado: 'Preço verificado PRECIVOX',
    requisitos: [
      'API batch (9.2) ou webhook incremental (9.4)',
      'SLA de resposta a divergências crowd < 24h',
      'Contrato LGPD assinado com PRECIVOX',
    ],
  },
};

export function normalizarTier(valor: unknown): ParceiroTier {
  const n = typeof valor === 'number' ? valor : parseInt(String(valor ?? ''), 10);
  if (n === 2 || n === 3) return n;
  return 1;
}

export function parseContrato(raw: unknown): ParceiroSlaContrato | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as ParceiroSlaContrato;
  if (!c.versao || !c.aceitoEm || !c.aceitoPorUserId) return null;
  return c;
}

export function contratoVigente(contrato: ParceiroSlaContrato | null): boolean {
  return Boolean(contrato && contrato.versao === CONTRATO_VERSAO_ATUAL);
}

export function intervaloPermitidoNoTier(
  tier: ParceiroTier,
  intervalo: SyncIntervalo
): boolean {
  return TIER_DEFINICOES[tier].intervalosSyncPermitidos.includes(intervalo);
}

export function diasStaleParaTier(tier: ParceiroTier): number {
  return TIER_DEFINICOES[tier].diasStaleMax;
}

export type ParceiroSlaResumo = {
  mercadoId: string;
  tier: ParceiroTier;
  tierInfo: TierDefinicao;
  contrato: ParceiroSlaContrato | null;
  contratoVigente: boolean;
  podeAtivarSync: boolean;
  avisoSync: string | null;
};

export async function obterParceiroSla(mercadoId: string): Promise<ParceiroSlaResumo> {
  const mercado = await prisma.mercados.findUnique({
    where: { id: mercadoId },
    select: { parceiroTier: true, parceiroSlaContrato: true, syncAgendado: true },
  });
  if (!mercado) {
    throw new Error('Mercado não encontrado');
  }

  const tier = normalizarTier(mercado.parceiroTier);
  const contrato = parseContrato(mercado.parceiroSlaContrato);
  const vigente = contratoVigente(contrato);
  const tierInfo = TIER_DEFINICOES[tier];

  let avisoSync: string | null = null;
  const sync = mercado.syncAgendado as { ativo?: boolean; intervalo?: SyncIntervalo } | null;
  if (sync?.ativo && sync.intervalo && !intervaloPermitidoNoTier(tier, sync.intervalo)) {
    avisoSync = `Intervalo "${sync.intervalo}" não é permitido no Tier ${tier}. Ajuste o sync ou solicite upgrade.`;
  }
  if (tier >= 2 && !vigente) {
    avisoSync = avisoSync ?? 'Aceite o contrato de dados para ativar sync automático (Tier 2+).';
  }

  return {
    mercadoId,
    tier,
    tierInfo,
    contrato,
    contratoVigente: vigente,
    podeAtivarSync: vigente && tier >= 1,
    avisoSync,
  };
}

export async function salvarTierParceiro(
  mercadoId: string,
  tier: ParceiroTier
): Promise<ParceiroSlaResumo> {
  await prisma.mercados.update({
    where: { id: mercadoId },
    data: {
      parceiroTier: tier,
      dataAtualizacao: new Date(),
    },
  });
  return obterParceiroSla(mercadoId);
}

export async function aceitarContratoParceiro(
  mercadoId: string,
  userId: string,
  nome?: string
): Promise<ParceiroSlaResumo> {
  const contrato: ParceiroSlaContrato = {
    versao: CONTRATO_VERSAO_ATUAL,
    aceitoEm: new Date().toISOString(),
    aceitoPorUserId: userId,
    aceitoPorNome: nome,
  };
  await prisma.mercados.update({
    where: { id: mercadoId },
    data: {
      parceiroSlaContrato: contrato,
      dataAtualizacao: new Date(),
    },
  });
  return obterParceiroSla(mercadoId);
}

/** Texto do contrato exibido na UI (resumo LGPD + SLA) */
export const CONTRATO_RESUMO_HTML = `
<p>O mercado parceiro declara que:</p>
<ul>
  <li>Os preços e estoques enviados são de sua responsabilidade e refletem a operação real.</li>
  <li>Autoriza o PRECIVOX a exibir preços aos consumidores com metadados de confiança (truth layer).</li>
  <li>Compromete-se com a cadência de atualização do tier escolhido (Tier 1: semanal; Tier 2: diário; Tier 3: API).</li>
  <li>Dados agregados e anonimizados podem alimentar insights de bairro (radar de demanda), conforme LGPD.</li>
  <li>O descumprimento do SLA pode reduzir selo de confiança e visibilidade na plataforma.</li>
</ul>
`.trim();
