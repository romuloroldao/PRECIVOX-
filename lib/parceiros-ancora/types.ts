/**
 * Épico 16 — Parceiros âncora (3–5 redes/atacados por região piloto)
 */

import type { RegiaoOfertaModo } from '@/lib/oferta-agregada/types';

export type ParceiroAncoraTipo = 'rede' | 'atacado' | 'atacarejo';

export type ParceiroAncoraConfig = {
  ativo: boolean;
  tipo: ParceiroAncoraTipo;
  regiaoModo: RegiaoOfertaModo;
  prioridade: number;
  rotulo?: string;
  designadoEm?: string;
  designadoPorUserId?: string;
};

export type ParceiroAncoraResumo = {
  mercadoId: string;
  nome: string;
  tipo: ParceiroAncoraTipo;
  tipoLabel: string;
  tier: number;
  prioridade: number;
  rotulo: string | null;
  selo: string | null;
  skusAtivos: number;
  pctStale: number;
};

export type RegiaoParceirosAncora = {
  regiaoDescricao: string;
  regiaoModo: RegiaoOfertaModo;
  mercadosNaRegiao: number;
  ancoraCount: number;
  metaMin: number;
  metaMax: number;
  regiaoCompleta: boolean;
  parceiros: ParceiroAncoraResumo[];
};

export const PARCEIRO_ANCORA_PADRAO: ParceiroAncoraConfig = {
  ativo: false,
  tipo: 'rede',
  regiaoModo: 'cep5',
  prioridade: 3,
};

export const ANCORA_META_MIN = 3;
export const ANCORA_META_MAX = 5;

export const TIPO_ANCORA_LABEL: Record<ParceiroAncoraTipo, string> = {
  rede: 'Rede regional',
  atacado: 'Atacado',
  atacarejo: 'Atacarejo',
};
