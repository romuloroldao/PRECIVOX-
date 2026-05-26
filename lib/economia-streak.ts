/**
 * Streak de economia confirmada — Sprint 3
 */

import { prisma } from '@/lib/prisma';

export type EconomiaStreakState = {
  semanasConsecutivas: number;
  ultimaSemanaISO: string | null;
  totalEconomiaEstimada: number;
  recorde: number;
};

function weekKey(d = new Date()): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x.toISOString().slice(0, 10);
}

export async function registrarEconomiaSemana(
  userId: string,
  valorEstimado: number
): Promise<EconomiaStreakState> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { perfilPreci: true },
  });

  const atual = (user?.perfilPreci as { economiaStreak?: EconomiaStreakState } | null)?.economiaStreak ?? {
    semanasConsecutivas: 0,
    ultimaSemanaISO: null,
    totalEconomiaEstimada: 0,
    recorde: 0,
  };

  const semana = weekKey();
  let semanas = atual.semanasConsecutivas;
  const ultima = atual.ultimaSemanaISO;

  if (ultima === semana) {
    // mesma semana — acumula
  } else if (ultima) {
    const prev = new Date(ultima);
    const curr = new Date(semana);
    const diffDays = (curr.getTime() - prev.getTime()) / 86400000;
    semanas = diffDays <= 8 ? semanas + 1 : 1;
  } else {
    semanas = 1;
  }

  const total = atual.totalEconomiaEstimada + Math.max(0, valorEstimado);
  const recorde = Math.max(atual.recorde, semanas);

  const next: EconomiaStreakState = {
    semanasConsecutivas: semanas,
    ultimaSemanaISO: semana,
    totalEconomiaEstimada: Math.round(total * 100) / 100,
    recorde,
  };

  const perfilBase = (user?.perfilPreci as Record<string, unknown>) ?? {};
  await prisma.user.update({
    where: { id: userId },
    data: {
      perfilPreci: { ...perfilBase, economiaStreak: next },
      dataAtualizacao: new Date(),
    },
  });

  return next;
}

export async function getEconomiaStreak(userId: string): Promise<EconomiaStreakState> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { perfilPreci: true },
  });
  return (
    (user?.perfilPreci as { economiaStreak?: EconomiaStreakState } | null)?.economiaStreak ?? {
      semanasConsecutivas: 0,
      ultimaSemanaISO: null,
      totalEconomiaEstimada: 0,
      recorde: 0,
    }
  );
}
