/**
 * Reputação crowd do mercado (Épico 14) — agrega confirmações recentes.
 */

import { prisma } from '@/lib/prisma';
import { nivelPorTotalConfirmacoes } from '@/lib/crowd-reputacao';
import { pesoNivelCrowd } from '@/lib/crowd-reputacao-peso';

export type ReputacaoMercadoCrowd = {
  mercadoId: string;
  confirmacoes48h: number;
  pesoPonderado48h: number;
  contribuidoresAtivos: number;
  nivelMedio: 'observador' | 'contribuidor' | 'guardiao' | 'embaixador';
  score: number;
  rotulo: string;
};

const JANELA_H = 48;

export async function getReputacaoMercadoCrowd(
  mercadoId: string
): Promise<ReputacaoMercadoCrowd> {
  const desde = new Date();
  desde.setHours(desde.getHours() - JANELA_H);

  const eventos = await prisma.userEvent.findMany({
    where: {
      mercadoId,
      type: 'preco_confirmado',
      timestamp: { gte: desde },
    },
    select: { userId: true },
  });

  if (!eventos.length) {
    return {
      mercadoId,
      confirmacoes48h: 0,
      pesoPonderado48h: 0,
      contribuidoresAtivos: 0,
      nivelMedio: 'observador',
      score: 0,
      rotulo: 'Sem validações recentes',
    };
  }

  const userIds = [...new Set(eventos.map((e) => e.userId))];
  const contagens = await prisma.userEvent.groupBy({
    by: ['userId'],
    where: { userId: { in: userIds }, type: 'preco_confirmado' },
    _count: { id: true },
  });
  const totalPorUser = new Map(contagens.map((c) => [c.userId, c._count.id]));

  let peso = 0;
  for (const ev of eventos) {
    const total = totalPorUser.get(ev.userId) ?? 0;
    peso += pesoNivelCrowd(nivelPorTotalConfirmacoes(total));
  }

  const niveis = userIds.map((uid) =>
    nivelPorTotalConfirmacoes(totalPorUser.get(uid) ?? 0)
  );
  const ordem = ['observador', 'contribuidor', 'guardiao', 'embaixador'] as const;
  const idxMedio = Math.round(
    niveis.reduce((s, n) => s + ordem.indexOf(n), 0) / niveis.length
  );
  const nivelMedio = ordem[Math.min(ordem.length - 1, idxMedio)] ?? 'observador';

  const score = Math.min(100, Math.round(peso * 2 + userIds.length * 3));
  let rotulo = 'Comunidade validando preços';
  if (score >= 70) rotulo = 'Preços validados pela comunidade';
  else if (score >= 35) rotulo = 'Validação crowd em crescimento';

  return {
    mercadoId,
    confirmacoes48h: eventos.length,
    pesoPonderado48h: Math.round(peso * 10) / 10,
    contribuidoresAtivos: userIds.length,
    nivelMedio,
    score,
    rotulo,
  };
}
