import type { SaasFeature, SaasTier } from '@/lib/monetizacao/types';
import { SAAS_TIER_FEATURES } from '@/lib/monetizacao/types';

export const SAAS_FEATURE_LABELS: Record<SaasFeature, string> = {
  radar_demanda: 'Radar de demanda do bairro',
  pricing_assistido: 'Pricing assistido',
  heatmap_intencao: 'Heatmap de intenção',
  benchmark_regional: 'Benchmark preço regional',
  ml_leve: 'ML leve (cesta, churn, elasticidade)',
  oferta_agregada: 'Oferta agregada da região',
  promo_direcionada: 'Promo direcionada por segmento',
  cpg_insights: 'Insights CPG agregados (LGPD)',
};

export type MarketingPlano = {
  tier: SaasTier;
  nome: string;
  descricao: string;
  valorMensal: number;
  destaque?: boolean;
  limiteUnidades: number;
  limiteUploadMb: number;
  cta: string;
  ctaHref: string;
};

export const MARKETING_PLANOS: MarketingPlano[] = [
  {
    tier: 'essencial',
    nome: 'Essencial',
    descricao: 'Inteligência essencial para começar a ler a demanda do seu bairro.',
    valorMensal: 299,
    limiteUnidades: 2,
    limiteUploadMb: 25,
    cta: 'Falar com comercial',
    ctaHref: '/demo',
  },
  {
    tier: 'pro',
    nome: 'Pro',
    descricao: 'Escala operacional com promo segmentada, benchmark e heatmap.',
    valorMensal: 799,
    destaque: true,
    limiteUnidades: 10,
    limiteUploadMb: 100,
    cta: 'Agendar demonstração',
    ctaHref: '/demo',
  },
  {
    tier: 'enterprise',
    nome: 'Enterprise',
    descricao: 'Inteligência de categoria para redes e parceiros estratégicos.',
    valorMensal: 1999,
    limiteUnidades: 50,
    limiteUploadMb: 500,
    cta: 'Solicitar proposta',
    ctaHref: '/demo',
  },
];

export function planoFeatures(tier: SaasTier): SaasFeature[] {
  return SAAS_TIER_FEATURES[tier];
}

export function formatPrecoBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}
