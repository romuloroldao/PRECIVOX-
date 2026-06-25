/**
 * Épico 18 — PRECI Network (Fase 4)
 * API de intenção de compra alimentar agregada (LGPD)
 */

export type PreciNetworkScope = 'intent' | 'categories';

export type PreciNetworkClientConfig = {
  key: string;
  scopes: PreciNetworkScope[];
  label?: string;
};

export type PreciNetworkIntentCategoria = {
  categoria: string;
  sinais: number;
  usuariosUnicosBucket: string;
  pressao: 'ALTA' | 'MEDIA';
  tendencia: 'alta' | 'estavel' | 'queda';
};

export type PreciNetworkIntentProduto = {
  chave: string;
  sinais: number;
  usuariosUnicosBucket: string;
};

export type PreciNetworkIntentResumo = {
  regiaoDescricao: string;
  periodoDias: number;
  mercadosNaRegiao: number;
  intentScoreMedio: number;
  totalSinais: number;
  consumidoresUnicosBucket: string;
  categorias: PreciNetworkIntentCategoria[];
  topProdutos: PreciNetworkIntentProduto[];
  explicacao: string;
  lgpd: string;
  geradoEm: string;
};

export const PRECI_NETWORK_LGPD =
  'Dados agregados com k-anonymity (≥5 usuários únicos por bucket). Sem identificação individual. Uso sujeito a contrato PRECI Network.';
