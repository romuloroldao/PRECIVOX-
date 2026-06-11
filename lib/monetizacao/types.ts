/**
 * Épico 17 — Monetização (SaaS gestor + CPG + promo direcionada)
 */

export type SaasTier = 'essencial' | 'pro' | 'enterprise';

export type SaasFeature =
  | 'radar_demanda'
  | 'pricing_assistido'
  | 'heatmap_intencao'
  | 'benchmark_regional'
  | 'ml_leve'
  | 'oferta_agregada'
  | 'promo_direcionada'
  | 'cpg_insights';

export type PromoSegmento = 'intent_alta' | 'churn_risco' | 'cesta_semana' | 'todos';

export type PromoDirecionada = {
  id: string;
  ativo: boolean;
  titulo: string;
  produtoId?: string;
  categoria?: string;
  descontoPct: number;
  segmento: PromoSegmento;
  validoAte: string;
  criadoEm: string;
};

export type MonetizacaoMercado = {
  promosDirecionadas: PromoDirecionada[];
  notasComerciais?: string;
};

export type PlanoSaasFeatures = {
  tier: SaasTier;
  features: SaasFeature[];
};

export type CpgInsightCategoria = {
  categoria: string;
  sinais: number;
  usuariosUnicos: number;
  tendencia: 'alta' | 'estavel' | 'queda';
  pressao: 'ALTA' | 'MEDIA';
};

export type CpgInsightsResumo = {
  regiaoDescricao: string;
  periodoDias: number;
  mercadosNaRegiao: number;
  categorias: CpgInsightCategoria[];
  topMarcas: { marca: string; sinais: number }[];
  explicacao: string;
  lgpd: string;
};

export const SAAS_TIER_LABEL: Record<SaasTier, string> = {
  essencial: 'Essencial',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export const SAAS_TIER_FEATURES: Record<SaasTier, SaasFeature[]> = {
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
};

export const MONETIZACAO_PADRAO: MonetizacaoMercado = {
  promosDirecionadas: [],
};

export const K_ANON_MIN = 5;
