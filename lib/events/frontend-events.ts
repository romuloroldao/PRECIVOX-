/**
 * Frontend Events Integration
 * 
 * Integra EventCollector nas ações do frontend
 * 
 * Eventos coletados:
 * - list.created
 * - product.viewed
 * - product.added_to_list
 * - search.performed
 * - stock.updated
 */

import { EventCollector } from '@/lib/ai/event-collector';

/**
 * Registra evento de lista criada
 */
export async function recordListCreated(
  userId: string,
  mercadoId: string,
  listaId: string
): Promise<void> {
  try {
    await EventCollector.recordEvent(
      userId,
      mercadoId,
      'lista_criada',
      { listaId }
    );
  } catch (error) {
    console.error('[FrontendEvents] Erro ao registrar lista criada:', error);
    // Não quebrar o fluxo se falhar
  }
}

/**
 * Registra evento de produto visualizado
 */
export async function recordProductViewed(
  userId: string,
  mercadoId: string,
  produtoId: string,
  categoriaId?: string
): Promise<void> {
  try {
    await EventCollector.recordEvent(
      userId,
      mercadoId,
      'produto_visualizado',
      { produtoId, categoriaId }
    );
  } catch (error) {
    console.error('[FrontendEvents] Erro ao registrar produto visualizado:', error);
  }
}

/**
 * Registra evento de produto adicionado à lista
 */
export async function recordProductAddedToList(
  userId: string,
  mercadoId: string,
  produtoId: string,
  listaId: string,
  quantidade: number,
  preco?: number
): Promise<void> {
  try {
    await EventCollector.recordEvent(
      userId,
      mercadoId,
      'produto_adicionado_lista',
      { produtoId, listaId, quantidade, preco }
    );
  } catch (error) {
    console.error('[FrontendEvents] Erro ao registrar produto adicionado:', error);
  }
}

/**
 * Registra evento de produto removido da lista
 */
export async function recordProductRemovedFromList(
  userId: string,
  mercadoId: string,
  produtoId: string,
  listaId: string
): Promise<void> {
  try {
    await EventCollector.recordEvent(
      userId,
      mercadoId,
      'produto_removido_lista',
      { produtoId, listaId }
    );
  } catch (error) {
    console.error('[FrontendEvents] Erro ao registrar produto removido:', error);
  }
}

/**
 * Registra evento de busca realizada
 */
export async function recordSearchPerformed(
  userId: string,
  mercadoId: string,
  searchQuery: string,
  resultados?: number
): Promise<void> {
  try {
    await EventCollector.recordEvent(
      userId,
      mercadoId,
      'produto_buscado',
      { searchQuery, resultados }
    );
  } catch (error) {
    console.error('[FrontendEvents] Erro ao registrar busca:', error);
  }
}

/**
 * Registra evento de compra realizada
 */
export async function recordPurchaseCompleted(
  userId: string,
  mercadoId: string,
  produtos: Array<{ produtoId: string; quantidade: number; preco: number }>,
  valorTotal: number
): Promise<void> {
  try {
    // Registrar evento para cada produto
    for (const produto of produtos) {
      await EventCollector.recordEvent(
        userId,
        mercadoId,
        'compra_realizada',
        {
          produtoId: produto.produtoId,
          quantidade: produto.quantidade,
          preco: produto.preco,
          valorTotal,
        }
      );
    }
  } catch (error) {
    console.error('[FrontendEvents] Erro ao registrar compra:', error);
  }
}

/**
 * Registra evento de horário de acesso
 */
export async function recordAccessTime(
  userId: string,
  mercadoId: string
): Promise<void> {
  try {
    await EventCollector.recordEvent(
      userId,
      mercadoId,
      'horario_acesso',
      { timestamp: new Date().toISOString() }
    );
  } catch (error) {
    console.error('[FrontendEvents] Erro ao registrar horário de acesso:', error);
  }
}

