import { prisma } from '@/lib/prisma';
import {
  SAAS_TIER_FEATURES,
  SAAS_TIER_LABEL,
  type PlanoSaasFeatures,
  type SaasFeature,
  type SaasTier,
} from './types';

function inferirTier(plano: {
  nome: string;
  valor: { toNumber(): number };
  features?: unknown;
}): SaasTier {
  if (plano.features && typeof plano.features === 'object') {
    const t = (plano.features as { tier?: string }).tier;
    if (t === 'pro' || t === 'enterprise' || t === 'essencial') return t;
  }
  const nome = plano.nome.toLowerCase();
  if (nome.includes('enterprise') || nome.includes('premium')) return 'enterprise';
  if (nome.includes('pro') || nome.includes('avan') || nome.includes('avanc')) return 'pro';
  const v = plano.valor.toNumber();
  if (v >= 1500) return 'enterprise';
  if (v >= 400) return 'pro';
  return 'essencial';
}

function parseFeaturesOverride(raw: unknown, tier: SaasTier): SaasFeature[] {
  if (raw && typeof raw === 'object') {
    const arr = (raw as { features?: unknown }).features;
    if (Array.isArray(arr) && arr.every((x) => typeof x === 'string')) {
      return arr as SaasFeature[];
    }
  }
  return SAAS_TIER_FEATURES[tier];
}

export type ResumoSaasMercado = {
  mercadoId: string;
  planoId: string | null;
  planoNome: string | null;
  valorMensal: number | null;
  tier: SaasTier;
  tierLabel: string;
  features: SaasFeature[];
  featuresBloqueadas: SaasFeature[];
  limiteUnidades: number | null;
  limiteUploadMb: number | null;
  explicacao: string;
};

export async function obterResumoSaasMercado(mercadoId: string): Promise<ResumoSaasMercado> {
  const mercado = await prisma.mercados.findUnique({
    where: { id: mercadoId },
    select: {
      id: true,
      planoId: true,
      planos_de_pagamento: {
        select: { id: true, nome: true, valor: true, limiteUnidades: true, limiteUploadMb: true, features: true },
      },
    },
  });

  if (!mercado) {
    return {
      mercadoId,
      planoId: null,
      planoNome: null,
      valorMensal: null,
      tier: 'essencial',
      tierLabel: SAAS_TIER_LABEL.essencial,
      features: SAAS_TIER_FEATURES.essencial,
      featuresBloqueadas: SAAS_TIER_FEATURES.enterprise.filter(
        (f) => !SAAS_TIER_FEATURES.essencial.includes(f)
      ),
      limiteUnidades: null,
      limiteUploadMb: null,
      explicacao: 'Mercado sem plano — recursos Essencial por padrão.',
    };
  }

  const plano = mercado.planos_de_pagamento;
  const tier = plano ? inferirTier(plano) : 'essencial';
  const features = plano
    ? parseFeaturesOverride(plano.features, tier)
    : SAAS_TIER_FEATURES.essencial;
  const allFeatures = SAAS_TIER_FEATURES.enterprise;
  const featuresBloqueadas = allFeatures.filter((f) => !features.includes(f));

  let explicacao = `Plano ${SAAS_TIER_LABEL[tier]} — ${features.length} módulos ativos.`;
  if (featuresBloqueadas.length > 0) {
    explicacao += ` Upgrade desbloqueia ${featuresBloqueadas.length} recurso(s) adicionais.`;
  }

  return {
    mercadoId,
    planoId: plano?.id ?? null,
    planoNome: plano?.nome ?? null,
    valorMensal: plano ? plano.valor.toNumber() : null,
    tier,
    tierLabel: SAAS_TIER_LABEL[tier],
    features,
    featuresBloqueadas,
    limiteUnidades: plano?.limiteUnidades ?? null,
    limiteUploadMb: plano?.limiteUploadMb ?? null,
    explicacao,
  };
}

export async function mercadoTemFeature(
  mercadoId: string,
  feature: SaasFeature
): Promise<boolean> {
  const resumo = await obterResumoSaasMercado(mercadoId);
  return resumo.features.includes(feature);
}

export function featureLabel(f: SaasFeature): string {
  const map: Record<SaasFeature, string> = {
    radar_demanda: 'Radar de demanda',
    pricing_assistido: 'Pricing assistido',
    heatmap_intencao: 'Heatmap intenção',
    benchmark_regional: 'Benchmark regional',
    ml_leve: 'ML leve',
    oferta_agregada: 'Oferta agregada',
    promo_direcionada: 'Promo direcionada',
    cpg_insights: 'Insights CPG',
  };
  return map[f];
}
