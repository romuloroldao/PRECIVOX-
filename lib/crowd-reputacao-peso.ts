import type { NivelContribuidor } from '@/lib/crowd-reputacao-labels';
import { nivelPorTotalConfirmacoes } from '@/lib/crowd-reputacao';

/** Peso da confirmação crowd por nível do contribuidor (Épico 4.2). */
export const PESO_NIVEL_CROWD: Record<NivelContribuidor, number> = {
  observador: 1,
  contribuidor: 1.25,
  guardiao: 1.5,
  embaixador: 2,
};

export function pesoNivelCrowd(nivel: NivelContribuidor): number {
  return PESO_NIVEL_CROWD[nivel];
}

/** Converte contagem bruta em equivalente ponderado para truth layer. */
export function confirmacoesEquivalentesPonderadas(pesoTotal: number): number {
  return Math.max(1, Math.round(pesoTotal));
}
