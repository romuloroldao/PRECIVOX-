/**
 * Selo de confiança do mercado para o consumidor (Épico 4.4)
 */

import { getCatalogoSaude } from '@/lib/catalogo-saude';
import {
  contratoVigente,
  normalizarTier,
  parseContrato,
  TIER_DEFINICOES,
  type ParceiroTier,
} from '@/lib/parceiro-sla';
import { prisma } from '@/lib/prisma';

const PCT_STALE_MAX_SEL0 = 15;

export type MercadoSeloConsumidor = {
  mercadoId: string;
  tier: ParceiroTier;
  selo: string | null;
  seloCurto: string | null;
};

function seloCurto(selo: string | null): string | null {
  if (!selo) return null;
  if (selo.includes('verificado')) return 'Preço verificado';
  if (selo.includes('Parceiro')) return 'Parceiro PRECIVOX';
  return selo;
}

export async function obterSeloMercadoConsumidor(
  mercadoId: string
): Promise<MercadoSeloConsumidor> {
  const mercado = await prisma.mercados.findUnique({
    where: { id: mercadoId, ativo: true },
    select: { id: true, parceiroTier: true, parceiroSlaContrato: true },
  });

  if (!mercado) {
    return { mercadoId, tier: 1, selo: null, seloCurto: null };
  }

  const tier = normalizarTier(mercado.parceiroTier);
  const tierInfo = TIER_DEFINICOES[tier];
  const vigente = contratoVigente(parseContrato(mercado.parceiroSlaContrato));

  if (!vigente || !tierInfo.seloMercado) {
    return { mercadoId, tier, selo: null, seloCurto: null };
  }

  const saude = await getCatalogoSaude(mercadoId);
  if (saude.pctStale > PCT_STALE_MAX_SEL0 || saude.totalSkus === 0) {
    return { mercadoId, tier, selo: null, seloCurto: null };
  }

  return {
    mercadoId,
    tier,
    selo: tierInfo.seloMercado,
    seloCurto: seloCurto(tierInfo.seloMercado),
  };
}

export async function obterSelosMercadosConsumidor(
  mercadoIds: string[]
): Promise<Record<string, MercadoSeloConsumidor>> {
  const uniq = [...new Set(mercadoIds.filter(Boolean))].slice(0, 40);
  const entries = await Promise.all(
    uniq.map(async (id) => [id, await obterSeloMercadoConsumidor(id)] as const)
  );
  return Object.fromEntries(entries);
}
