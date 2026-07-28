import 'server-only';

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { EventCollector } from '@/lib/ai/event-collector';
import {
  montarElConfigPersistido,
  parseElPreferenciasFromPerfil,
  resolverElPreferenciasFromPerfil,
} from '@/lib/el-config-preferencias';
import { elConfigEfetivo, parseElConfigFromPerfil } from '@/lib/el-config-usuario';
import {
  analisarSinaisEl,
  calcularRefinamentoEl,
  parseElRefinamentoPendente,
  type ElRefinamentoPendente,
} from '@/lib/el-refinamento-core';

export {
  ajustarPrioridadeEl,
  analisarSinaisEl,
  calcularRefinamentoEl,
  parseElRefinamentoPendente,
  type ElRefinamentoPendente,
} from '@/lib/el-refinamento-core';

const DIAS_JANELA = 30;

export async function refinarElConfigUsuario(userId: string): Promise<boolean> {
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - DIAS_JANELA);

  const [dbUser, eventos] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { perfilPreci: true } }),
    EventCollector.getUserEventsGlobal(userId, inicio, new Date()),
  ]);

  const perfilPreci = dbUser?.perfilPreci;
  const cfgAtual = elConfigEfetivo(parseElConfigFromPerfil(perfilPreci));
  const preferenciasAtuais = resolverElPreferenciasFromPerfil(perfilPreci);
  const prevEl = (perfilPreci as { elConfig?: { refinamentoPendente?: ElRefinamentoPendente } } | null)
    ?.elConfig;

  if (prevEl?.refinamentoPendente) return false;

  const refinamento = calcularRefinamentoEl(preferenciasAtuais, cfgAtual, eventos);
  if (!refinamento) return false;

  const base =
    perfilPreci && typeof perfilPreci === 'object'
      ? { ...(perfilPreci as Record<string, unknown>) }
      : {};

  const refinamentoPendente: ElRefinamentoPendente = {
    mensagem: refinamento.mensagem,
    preferenciasAnteriores: parseElPreferenciasFromPerfil(perfilPreci) ?? preferenciasAtuais,
    numerosAnteriores: cfgAtual,
    em: new Date().toISOString(),
  };

  base.elConfig = {
    ...montarElConfigPersistido(refinamento.preferencias, refinamento.numeros, {
      onboardingCompleto: true,
    }),
    inferidoDe: 'comportamento',
    confianca: Math.min(95, 50 + analisarSinaisEl(eventos).total * 3),
    refinamentoPendente,
  };

  await prisma.user.update({
    where: { id: userId },
    data: {
      perfilPreci: base as Prisma.InputJsonValue,
      dataAtualizacao: new Date(),
    },
  });

  return true;
}

export async function confirmarRefinamentoEl(userId: string): Promise<void> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { perfilPreci: true },
  });
  const base =
    dbUser?.perfilPreci && typeof dbUser.perfilPreci === 'object'
      ? { ...(dbUser.perfilPreci as Record<string, unknown>) }
      : {};
  const el = (base.elConfig as Record<string, unknown> | undefined) ?? {};
  delete el.refinamentoPendente;
  base.elConfig = el;
  await prisma.user.update({
    where: { id: userId },
    data: { perfilPreci: base as Prisma.InputJsonValue, dataAtualizacao: new Date() },
  });
}

export async function desfazerRefinamentoEl(userId: string): Promise<void> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { perfilPreci: true },
  });
  const pendente = parseElRefinamentoPendente(dbUser?.perfilPreci);
  if (!pendente) return;

  const base =
    dbUser?.perfilPreci && typeof dbUser.perfilPreci === 'object'
      ? { ...(dbUser.perfilPreci as Record<string, unknown>) }
      : {};

  base.elConfig = {
    ...montarElConfigPersistido(pendente.preferenciasAnteriores, pendente.numerosAnteriores, {
      onboardingCompleto: true,
    }),
    inferidoDe: 'manual',
  };

  await prisma.user.update({
    where: { id: userId },
    data: { perfilPreci: base as Prisma.InputJsonValue, dataAtualizacao: new Date() },
  });
}

export async function refinarElConfigBatch(limit = 200): Promise<{ processados: number; ajustados: number }> {
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - DIAS_JANELA);

  const userIds = await prisma.userEvent.findMany({
    where: { type: 'el_sugestao_resposta', timestamp: { gte: inicio } },
    select: { userId: true },
    distinct: ['userId'],
    take: limit,
  });

  let ajustados = 0;
  for (const { userId } of userIds) {
    if (await refinarElConfigUsuario(userId)) ajustados += 1;
  }
  return { processados: userIds.length, ajustados };
}
