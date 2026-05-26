/**
 * Níveis de contribuidor crowd (Waze de preços) — Sprint 2
 */

import { prisma } from '@/lib/prisma';

export type NivelContribuidor =
  | 'observador'
  | 'contribuidor'
  | 'guardiao'
  | 'embaixador';

const LIMITES: Record<NivelContribuidor, number> = {
  observador: 0,
  contribuidor: 5,
  guardiao: 25,
  embaixador: 100,
};

export function nivelPorTotalConfirmacoes(total: number): NivelContribuidor {
  if (total >= LIMITES.embaixador) return 'embaixador';
  if (total >= LIMITES.guardiao) return 'guardiao';
  if (total >= LIMITES.contribuidor) return 'contribuidor';
  return 'observador';
}

export const LABEL_NIVEL: Record<NivelContribuidor, string> = {
  observador: 'Observador',
  contribuidor: 'Contribuidor',
  guardiao: 'Guardião do bairro',
  embaixador: 'Embaixador PRECI',
};

export async function getReputacaoCrowd(userId: string): Promise<{
  nivel: NivelContribuidor;
  label: string;
  confirmacoes: number;
  reportes: number;
  proximoNivelEm: number | null;
}> {
  const [confirmacoes, reportes] = await Promise.all([
    prisma.userEvent.count({ where: { userId, type: 'preco_confirmado' } }),
    prisma.userEvent.count({ where: { userId, type: 'preco_reportado' } }),
  ]);

  const nivel = nivelPorTotalConfirmacoes(confirmacoes);
  const proximo =
    nivel === 'observador'
      ? LIMITES.contribuidor - confirmacoes
      : nivel === 'contribuidor'
        ? LIMITES.guardiao - confirmacoes
        : nivel === 'guardiao'
          ? LIMITES.embaixador - confirmacoes
          : null;

  return {
    nivel,
    label: LABEL_NIVEL[nivel],
    confirmacoes,
    reportes,
    proximoNivelEm: proximo != null && proximo > 0 ? proximo : null,
  };
}
