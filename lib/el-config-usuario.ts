/**
 * Configuração de Economia Líquida por usuário (Épico 1.4)
 * Persistida em `User.perfilPreci.elConfig`.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { EL_DEFAULTS, type CalcularELInput } from '@/lib/economia-liquida';

export type ElConfigUsuario = {
  valorHoraReais: number;
  custoKmReais: number;
};

export const EL_CONFIG_LIMITS = {
  valorHoraMin: 8,
  valorHoraMax: 150,
  custoKmMin: 0.3,
  custoKmMax: 3,
} as const;

export function elConfigEfetivo(raw: Partial<ElConfigUsuario> | null | undefined): ElConfigUsuario {
  return {
    valorHoraReais: clamp(
      raw?.valorHoraReais ?? EL_DEFAULTS.valorHoraReais,
      EL_CONFIG_LIMITS.valorHoraMin,
      EL_CONFIG_LIMITS.valorHoraMax
    ),
    custoKmReais: clamp(
      raw?.custoKmReais ?? EL_DEFAULTS.custoKmReais,
      EL_CONFIG_LIMITS.custoKmMin,
      EL_CONFIG_LIMITS.custoKmMax
    ),
  };
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.round(Math.min(max, Math.max(min, n)) * 100) / 100;
}

export function parseElConfigFromPerfil(perfilPreci: unknown): ElConfigUsuario | null {
  if (!perfilPreci || typeof perfilPreci !== 'object') return null;
  const raw = (perfilPreci as { elConfig?: Partial<ElConfigUsuario> }).elConfig;
  if (!raw || typeof raw !== 'object') return null;
  if (raw.valorHoraReais == null && raw.custoKmReais == null) return null;
  return elConfigEfetivo(raw);
}

export function validarElConfigInput(
  input: Partial<ElConfigUsuario> | null | undefined
): ElConfigUsuario | null {
  if (!input || typeof input !== 'object') return null;
  if (input.valorHoraReais == null && input.custoKmReais == null) return null;
  return elConfigEfetivo(input);
}

export async function getElConfigUsuario(userId: string): Promise<ElConfigUsuario> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { perfilPreci: true },
  });
  return elConfigEfetivo(parseElConfigFromPerfil(user?.perfilPreci));
}

export async function getElCalcularOpts(
  userId?: string | null
): Promise<Pick<CalcularELInput, 'valorHoraReais' | 'custoKmReais'>> {
  if (!userId) return {};
  const cfg = await getElConfigUsuario(userId);
  return {
    valorHoraReais: cfg.valorHoraReais,
    custoKmReais: cfg.custoKmReais,
  };
}

export async function salvarElConfigUsuario(
  userId: string,
  config: ElConfigUsuario
): Promise<void> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { perfilPreci: true },
  });
  const base =
    dbUser?.perfilPreci && typeof dbUser.perfilPreci === 'object'
      ? { ...(dbUser.perfilPreci as Record<string, unknown>) }
      : {};

  base.elConfig = {
    ...elConfigEfetivo(config),
    atualizadoEm: new Date().toISOString(),
  };

  await prisma.user.update({
    where: { id: userId },
    data: {
      perfilPreci: base as Prisma.InputJsonValue,
      dataAtualizacao: new Date(),
    },
  });
}

/** Rótulo amigável para UI */
export function labelFaixaValorHora(v: number): string {
  if (v <= 15) return 'Tempo vale pouco — priorize preço';
  if (v <= 25) return 'Equilíbrio preço × tempo';
  if (v <= 40) return 'Seu tempo vale bastante';
  return 'Conveniência em primeiro lugar';
}
