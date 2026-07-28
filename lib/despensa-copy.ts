/**
 * Copy operacional preditiva da Despensa (Fase 3).
 * Não inventa estoque físico — só interpreta ciclo/diasRestantes já calculados.
 *
 * @see docs/PROPOSTA_AI_NATIVE_SHOPPING_JOURNEY.md §8
 */

import type { DespensaItem, DespensaStatus } from '@/lib/despensa-digital';

export type DespensaCopyInput = Pick<
  DespensaItem,
  'status' | 'diasRestantes' | 'cicloDias' | 'nome'
> & {
  /** Intent Score 0–100; se alto + ~1 dia restante → “compraria amanhã” */
  intentScore?: number | null;
};

export type DespensaCopyResult = {
  /** Frase principal operacional */
  primaria: string;
  /** Detalhe curto (ciclo / fonte) */
  secundaria: string;
  /** Se deve destacar CTA “Incluir na compra” */
  urgencia: 'alta' | 'media' | 'baixa';
};

const INTENT_COMPRA_AMANHA = 55;

/**
 * Linguagem operacional — nunca “a IA recomenda”.
 */
export function copyDespensaPreditiva(item: DespensaCopyInput): DespensaCopyResult {
  const dias = item.diasRestantes;
  const intent = item.intentScore ?? null;

  if (item.status === 'acabando' || (dias != null && dias <= 0)) {
    return {
      primaria: 'Provavelmente acabou.',
      secundaria: cicloLabel(item.cicloDias),
      urgencia: 'alta',
    };
  }

  if (dias === 1 && intent != null && intent >= INTENT_COMPRA_AMANHA) {
    return {
      primaria: 'Normalmente você compraria isso amanhã.',
      secundaria: cicloLabel(item.cicloDias),
      urgencia: 'alta',
    };
  }

  if (dias != null && dias >= 1 && dias <= 3) {
    return {
      primaria: `Deve durar mais ~${dias} ${dias === 1 ? 'dia' : 'dias'}.`,
      secundaria: cicloLabel(item.cicloDias),
      urgencia: 'media',
    };
  }

  if (item.status === 'atencao') {
    return {
      primaria: dias != null ? `Deve durar mais ~${dias} dias.` : 'Repor em breve.',
      secundaria: cicloLabel(item.cicloDias),
      urgencia: 'media',
    };
  }

  return {
    primaria: 'Em dia.',
    secundaria: cicloLabel(item.cicloDias),
    urgencia: 'baixa',
  };
}

function cicloLabel(cicloDias: number): string {
  return `Você costuma repor a cada ~${cicloDias} dias`;
}

export function labelStatusCurto(status: DespensaStatus): string {
  if (status === 'acabando') return 'Acabando';
  if (status === 'atencao') return 'Atenção';
  return 'Em dia';
}

export function deveSugerirIncluirNaCompra(urgencia: DespensaCopyResult['urgencia']): boolean {
  return urgencia === 'alta' || urgencia === 'media';
}
