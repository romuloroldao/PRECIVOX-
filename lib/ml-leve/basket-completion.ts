import { prisma } from '@/lib/prisma';
import { EventCollector } from '@/lib/ai/event-collector';
import type { UserEvent, UserEventType } from '@/lib/ai/types';
import {
  buildCoocorrenciaFromCestas,
  extrairCestasDeEventos,
  sugerirPorCoocorrencia,
} from './coocorrencia';
import type { ItemBasketCompletion } from './types';

const DIAS_HISTORICO = 90;

async function coocorrenciaMercado(mercadoId: string): Promise<ReturnType<typeof buildCoocorrenciaFromCestas>> {
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - DIAS_HISTORICO);

  const eventos = await prisma.userEvent.findMany({
    where: { mercadoId, timestamp: { gte: inicio } },
    orderBy: { timestamp: 'asc' },
    take: 8000,
    select: {
      id: true,
      userId: true,
      mercadoId: true,
      type: true,
      timestamp: true,
      metadata: true,
    },
  });

  const cestas = extrairCestasDeEventos(
    eventos.map(
      (e): UserEvent => ({
        id: e.id,
        userId: e.userId,
        mercadoId: e.mercadoId,
        type: e.type as UserEventType,
        timestamp: e.timestamp,
        metadata: (e.metadata ?? {}) as UserEvent['metadata'],
      })
    )
  );
  return buildCoocorrenciaFromCestas(cestas);
}

/**
 * Basket completion — sugere itens que costumam ir junto aos da lista atual.
 */
export async function sugerirBasketCompletion(
  userId: string,
  mercadoId: string,
  produtoIdsNaLista: string[],
  limite = 6
): Promise<{
  itens: ItemBasketCompletion[];
  explicacao: string;
}> {
  const naLista = new Set(produtoIdsNaLista.filter(Boolean));
  if (naLista.size === 0) {
    return {
      itens: [],
      explicacao: 'Adicione itens à lista para ver sugestões de complemento.',
    };
  }

  const inicio = new Date();
  inicio.setDate(inicio.getDate() - DIAS_HISTORICO);

  const eventosUsuario = await EventCollector.getUserEvents(userId, mercadoId, inicio, new Date());
  const mapUsuario = buildCoocorrenciaFromCestas(extrairCestasDeEventos(eventosUsuario));
  const mapMercado = await coocorrenciaMercado(mercadoId);

  const candidatosUsuario = sugerirPorCoocorrencia(mapUsuario, naLista, limite * 2);
  const candidatosMercado = sugerirPorCoocorrencia(mapMercado, naLista, limite * 2);

  const merged = new Map<string, { score: number; fonte: 'voce' | 'bairro' }>();
  for (const c of candidatosUsuario) {
    merged.set(c.produtoId, { score: c.score * 1.4, fonte: 'voce' });
  }
  for (const c of candidatosMercado) {
    const prev = merged.get(c.produtoId);
    if (prev) {
      merged.set(c.produtoId, { score: prev.score + c.score, fonte: 'voce' });
    } else {
      merged.set(c.produtoId, { score: c.score, fonte: 'bairro' });
    }
  }

  const top = [...merged.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limite);

  if (!top.length) {
    return {
      itens: [],
      explicacao: 'Ainda não há correlações suficientes — continue usando a lista no PRECIVOX.',
    };
  }

  const produtos = await prisma.produtos.findMany({
    where: {
      id: { in: top.map(([id]) => id) },
      ativo: true,
      estoques: { some: { unidades: { mercadoId, ativa: true } } },
    },
    select: { id: true, nome: true },
  });
  const nomes = new Map(produtos.map((p) => [p.id, p.nome ?? 'Produto']));

  const maxScore = top[0][1].score || 1;
  const itens: ItemBasketCompletion[] = top.map(([produtoId, meta]) => ({
    produtoId,
    nome: nomes.get(produtoId) ?? 'Produto',
    confianca: Math.round((meta.score / maxScore) * 100) / 100,
    motivo:
      meta.fonte === 'voce'
        ? 'Costuma ir junto no seu histórico de listas'
        : 'Frequentemente comprado junto neste mercado',
  }));

  return {
    itens,
    explicacao:
      'Sugestões por market-basket leve (co-ocorrência nas suas cestas e no mercado) — IA explicável, sem caixa-preta.',
  };
}
