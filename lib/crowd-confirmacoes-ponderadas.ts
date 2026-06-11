import { prisma } from '@/lib/prisma';
import { nivelPorTotalConfirmacoes } from '@/lib/crowd-reputacao';
import { pesoNivelCrowd } from '@/lib/crowd-reputacao-peso';

/**
 * Soma ponderada de confirmações crowd por estoque (janela 48h).
 * Embaixador conta 2× observador na confiança do preço.
 */
export async function somarConfirmacoesPonderadasEstoque(
  estoqueId: string,
  desde: Date
): Promise<number> {
  const eventos = await prisma.userEvent.findMany({
    where: {
      type: 'preco_confirmado',
      timestamp: { gte: desde },
      metadata: { path: ['estoqueId'], equals: estoqueId },
    },
    select: { userId: true },
  });

  if (!eventos.length) return 0;

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
  return peso;
}
