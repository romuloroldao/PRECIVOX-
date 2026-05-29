/**
 * Labels de gamificação crowd — client-safe (sem Prisma).
 */

export type NivelContribuidor =
  | 'observador'
  | 'contribuidor'
  | 'guardiao'
  | 'embaixador';

export const LABEL_NIVEL: Record<NivelContribuidor, string> = {
  observador: 'Observador',
  contribuidor: 'Contribuidor',
  guardiao: 'Guardião do bairro',
  embaixador: 'Embaixador PRECI',
};
