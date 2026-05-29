/**
 * Truth layer — metadados de confiança de preço em estoques
 * @see docs/SPEC_ECONOMIA_LIQUIDA.md · migration estoque_truth_layer
 */

import type { EstoqueFonte } from '@prisma/client';

export const CONFIANCA = {
  UPLOAD_INICIAL: 70,
  UPLOAD_REIMPORT: 75,
  API_PARCEIRO: 85,
  MANUAL_GESTOR: 80,
  CROWD_CONFIRMADO: 90,
  CROWD_DIVERGENTE: 40,
} as const;

export interface TruthLayerPayload {
  fonte: EstoqueFonte;
  confianca: number;
  verificadoEm: Date;
}

/** Dados via webhook incremental parceiro (9.4) */
export function truthFromWebhookPreco(): TruthLayerPayload {
  return {
    fonte: 'API_PARCEIRO',
    confianca: 90,
    verificadoEm: new Date(),
  };
}

/** Dados via API batch parceiro (9.2) */
export function truthFromPartnerApi(): TruthLayerPayload {
  return {
    fonte: 'API_PARCEIRO',
    confianca: CONFIANCA.API_PARCEIRO,
    verificadoEm: new Date(),
  };
}

/** Dados ao importar catálogo do parceiro (upload-smart) */
export function truthFromUpload(reimport = false): TruthLayerPayload {
  const now = new Date();
  return {
    fonte: 'UPLOAD_GESTOR',
    confianca: reimport ? CONFIANCA.UPLOAD_REIMPORT : CONFIANCA.UPLOAD_INICIAL,
    verificadoEm: now,
  };
}

/** Ajuste após confirmação crowd */
export function truthFromCrowdConfirmacao(confirmacoesRecentes: number): TruthLayerPayload {
  const boost = Math.min(15, confirmacoesRecentes * 3);
  return {
    fonte: 'CROWD',
    confianca: Math.min(100, CONFIANCA.CROWD_CONFIRMADO + boost),
    verificadoEm: new Date(),
  };
}

export function truthFromCrowdDivergencia(): TruthLayerPayload {
  return {
    fonte: 'CROWD',
    confianca: CONFIANCA.CROWD_DIVERGENTE,
    verificadoEm: new Date(),
  };
}

export { labelConfianca, labelFrescorPreco } from '@/lib/estoque-truth-labels';
