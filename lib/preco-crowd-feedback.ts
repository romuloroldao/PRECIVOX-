/**
 * Processa feedback crowd sobre preço e atualiza truth layer do estoque.
 */

import { prisma } from '@/lib/prisma';
import { EventCollector } from '@/lib/ai/event-collector';
import {
  truthFromCrowdConfirmacao,
  truthFromCrowdDivergencia,
  CONFIANCA,
} from '@/lib/estoque-truth';
import { validarFeedbackCrowd } from '@/lib/crowd-v2/antifraude';
import { somarConfirmacoesPonderadasEstoque } from '@/lib/crowd-confirmacoes-ponderadas';
import { confirmacoesEquivalentesPonderadas } from '@/lib/crowd-reputacao-peso';

export type FeedbackPrecoTipo = 'confirmado' | 'mais_caro' | 'mais_barato';

const JANELA_CONFIRMACOES_H = 48;

export async function processarFeedbackPreco(input: {
  userId: string;
  estoqueId: string;
  tipo: FeedbackPrecoTipo;
  precoVisto?: number;
}): Promise<{ confianca: number; confirmacoesRecentes: number }> {
  const estoque = await prisma.estoques.findUnique({
    where: { id: input.estoqueId },
    include: {
      unidades: { select: { mercadoId: true } },
      produtos: { select: { id: true } },
    },
  });

  if (!estoque?.unidades) {
    throw new Error('Estoque não encontrado');
  }

  const anti = await validarFeedbackCrowd({
    userId: input.userId,
    estoqueId: input.estoqueId,
    tipo: input.tipo === 'confirmado' ? 'preco_confirmado' : 'preco_reportado',
  });
  if (anti.ok === false) {
    throw new Error(anti.motivo);
  }

  const mercadoId = estoque.unidades.mercadoId;
  const produtoId = estoque.produtos.id;

  if (input.tipo === 'confirmado') {
    await EventCollector.recordEvent(input.userId, mercadoId, 'preco_confirmado', {
      produtoId,
      estoqueId: input.estoqueId,
      precoVisto: input.precoVisto,
      unidadeId: estoque.unidadeId,
    });
  } else {
    await EventCollector.recordEvent(input.userId, mercadoId, 'preco_reportado', {
      produtoId,
      estoqueId: input.estoqueId,
      direcao: input.tipo,
      precoVisto: input.precoVisto,
      unidadeId: estoque.unidadeId,
    });
  }

  const desde = new Date();
  desde.setHours(desde.getHours() - JANELA_CONFIRMACOES_H);

  let confirmacoesRecentes = 0;
  let divergenciasRecentes = 0;
  try {
    const [pesoPonderado, divergencias] = await Promise.all([
      somarConfirmacoesPonderadasEstoque(input.estoqueId, desde),
      prisma.userEvent.count({
        where: {
          type: 'preco_reportado',
          timestamp: { gte: desde },
          metadata: {
            path: ['estoqueId'],
            equals: input.estoqueId,
          },
        },
      }),
    ]);
    confirmacoesRecentes = confirmacoesEquivalentesPonderadas(pesoPonderado);
    divergenciasRecentes = divergencias;
  } catch (e) {
    console.error('[preco-crowd-feedback] user_events indisponível:', e);
    if (input.tipo === 'confirmado') confirmacoesRecentes = 1;
  }

  let truth;
  if (input.tipo === 'confirmado' && divergenciasRecentes <= confirmacoesRecentes) {
    truth = truthFromCrowdConfirmacao(confirmacoesRecentes);
  } else if (input.tipo !== 'confirmado') {
    truth = truthFromCrowdDivergencia();
  } else {
    truth = {
      fonte: 'CROWD' as const,
      confianca: Math.max(CONFIANCA.CROWD_DIVERGENTE, CONFIANCA.CROWD_CONFIRMADO - 10),
      verificadoEm: new Date(),
    };
  }

  await prisma.estoques.update({
    where: { id: input.estoqueId },
    data: {
      fonte: truth.fonte,
      confianca: truth.confianca,
      verificadoEm: truth.verificadoEm,
      atualizadoEm: new Date(),
    },
  });

  return { confianca: truth.confianca, confirmacoesRecentes };
}
