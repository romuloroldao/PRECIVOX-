/**
 * Eventos disparados pelo browser — sempre via API (sem Prisma no bundle do cliente).
 */

import type { UserEventType } from '@/lib/ai/types';

async function postEvent(
  type: UserEventType,
  userId: string,
  mercadoId: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    await fetch('/api/events/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ type, userId, mercadoId, metadata }),
    });
  } catch (error) {
    console.error('[FrontendEvents] Falha ao enviar evento:', error);
  }
}

export async function recordListCreated(
  userId: string,
  mercadoId: string,
  listaId: string
): Promise<void> {
  await postEvent('lista_criada', userId, mercadoId, { listaId });
}

export async function recordProductViewed(
  userId: string,
  mercadoId: string,
  produtoId: string,
  categoriaId?: string
): Promise<void> {
  await postEvent('produto_visualizado', userId, mercadoId, {
    produtoId,
    ...(categoriaId ? { categoriaId } : {}),
  });
}

export async function recordProductAddedToList(
  userId: string,
  mercadoId: string,
  produtoId: string,
  listaId: string,
  quantidade: number,
  preco?: number
): Promise<void> {
  await postEvent('produto_adicionado_lista', userId, mercadoId, {
    produtoId,
    listaId,
    quantidade,
    ...(preco !== undefined ? { preco } : {}),
  });
}

export async function recordProductRemovedFromList(
  userId: string,
  mercadoId: string,
  produtoId: string,
  listaId: string
): Promise<void> {
  await postEvent('produto_removido_lista', userId, mercadoId, {
    produtoId,
    listaId,
  });
}

export async function recordSearchPerformed(
  userId: string,
  mercadoId: string,
  searchQuery: string,
  resultados?: number
): Promise<void> {
  await postEvent('produto_buscado', userId, mercadoId, {
    searchQuery,
    ...(resultados !== undefined ? { resultados } : {}),
  });
}

export async function recordPurchaseCompleted(
  userId: string,
  mercadoId: string,
  produtos: Array<{ produtoId: string; quantidade: number; preco: number }>,
  valorTotal: number
): Promise<void> {
  for (const produto of produtos) {
    await postEvent('compra_realizada', userId, mercadoId, {
      produtoId: produto.produtoId,
      quantidade: produto.quantidade,
      preco: produto.preco,
      valorTotal,
    });
  }
}

export async function recordAccessTime(userId: string, mercadoId: string): Promise<void> {
  await postEvent('horario_acesso', userId, mercadoId, {
    timestamp: new Date().toISOString(),
  });
}
