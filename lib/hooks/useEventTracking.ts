/**
 * Hook para rastreamento de eventos no frontend
 * 
 * Facilita integração de eventos para IA
 */

import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  recordProductViewed,
  recordProductAddedToList,
  recordProductRemovedFromList,
  recordSearchPerformed,
  recordListCreated,
  recordAccessTime,
} from '@/lib/events/frontend-events';

export function useEventTracking() {
  const { data: session } = useSession();
  const userId = session?.user?.id || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null) || 'anonymous';

  const trackProductView = useCallback(async (
    produtoId: string,
    mercadoId: string,
    categoriaId?: string
  ) => {
    if (!userId || userId === 'anonymous') return;
    
    try {
      await recordProductViewed(userId, mercadoId, produtoId, categoriaId);
    } catch (error) {
      console.error('[useEventTracking] Erro ao rastrear visualização:', error);
    }
  }, [userId]);

  const trackProductAdded = useCallback(async (
    produtoId: string,
    mercadoId: string,
    listaId: string,
    quantidade: number,
    preco?: number
  ) => {
    if (!userId || userId === 'anonymous') return;
    
    try {
      await recordProductAddedToList(userId, mercadoId, produtoId, listaId, quantidade, preco);
    } catch (error) {
      console.error('[useEventTracking] Erro ao rastrear adição:', error);
    }
  }, [userId]);

  const trackProductRemoved = useCallback(async (
    produtoId: string,
    mercadoId: string,
    listaId: string
  ) => {
    if (!userId || userId === 'anonymous') return;
    
    try {
      await recordProductRemovedFromList(userId, mercadoId, produtoId, listaId);
    } catch (error) {
      console.error('[useEventTracking] Erro ao rastrear remoção:', error);
    }
  }, [userId]);

  const trackSearch = useCallback(async (
    searchQuery: string,
    mercadoId: string,
    resultados?: number
  ) => {
    if (!userId || userId === 'anonymous') return;
    
    try {
      await recordSearchPerformed(userId, mercadoId, searchQuery, resultados);
    } catch (error) {
      console.error('[useEventTracking] Erro ao rastrear busca:', error);
    }
  }, [userId]);

  const trackListCreated = useCallback(async (
    listaId: string,
    mercadoId: string
  ) => {
    if (!userId || userId === 'anonymous') return;
    
    try {
      await recordListCreated(userId, mercadoId, listaId);
    } catch (error) {
      console.error('[useEventTracking] Erro ao rastrear lista criada:', error);
    }
  }, [userId]);

  const trackAccess = useCallback(async (mercadoId: string) => {
    if (!userId || userId === 'anonymous') return;
    
    try {
      await recordAccessTime(userId, mercadoId);
    } catch (error) {
      console.error('[useEventTracking] Erro ao rastrear acesso:', error);
    }
  }, [userId]);

  return {
    trackProductView,
    trackProductAdded,
    trackProductRemoved,
    trackSearch,
    trackListCreated,
    trackAccess,
  };
}

