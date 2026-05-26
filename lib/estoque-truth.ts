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

/** Label para UI (Sprint 1) */
export function labelFrescorPreco(verificadoEm: Date | null, atualizadoEm: Date): string {
  const ref = verificadoEm ?? atualizadoEm;
  const horas = (Date.now() - ref.getTime()) / (1000 * 60 * 60);
  if (horas < 1) return 'Atualizado agora';
  if (horas < 24) return `Atualizado há ${Math.floor(horas)}h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'Atualizado ontem';
  return `Atualizado há ${dias} dias`;
}

export function labelConfianca(confianca: number): 'alta' | 'media' | 'baixa' {
  if (confianca >= 80) return 'alta';
  if (confianca >= 55) return 'media';
  return 'baixa';
}
