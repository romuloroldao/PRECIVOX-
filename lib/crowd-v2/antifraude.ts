/**
 * Anti-fraude básico para feedback crowd (Épico 14).
 */

import { prisma } from '@/lib/prisma';

const MAX_FEEDBACK_POR_ESTOQUE_DIA = 3;
const MIN_INTERVALO_MS = 45_000;

export type AntifraudeResult = { ok: true } | { ok: false; motivo: string };

export async function validarFeedbackCrowd(input: {
  userId: string;
  estoqueId: string;
  tipo: string;
}): Promise<AntifraudeResult> {
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);

  const [hoje, ultimo] = await Promise.all([
    prisma.userEvent.count({
      where: {
        userId: input.userId,
        type: { in: ['preco_confirmado', 'preco_reportado'] },
        timestamp: { gte: inicioDia },
        metadata: { path: ['estoqueId'], equals: input.estoqueId },
      },
    }),
    prisma.userEvent.findFirst({
      where: {
        userId: input.userId,
        type: { in: ['preco_confirmado', 'preco_reportado'] },
      },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    }),
  ]);

  if (hoje >= MAX_FEEDBACK_POR_ESTOQUE_DIA) {
    return {
      ok: false,
      motivo: 'Limite diário de confirmações neste produto. Tente amanhã.',
    };
  }

  if (ultimo && Date.now() - ultimo.timestamp.getTime() < MIN_INTERVALO_MS) {
    return {
      ok: false,
      motivo: 'Aguarde alguns segundos antes de enviar outro feedback.',
    };
  }

  return { ok: true };
}
