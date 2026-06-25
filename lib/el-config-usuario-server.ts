import 'server-only';

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import type { CalcularELInput } from '@/lib/economia-liquida';
import {
  elConfigEfetivo,
  parseElConfigFromPerfil,
  type ElConfigUsuario,
} from '@/lib/el-config-usuario';

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
