// src/hooks/useInfiniteScroll.ts - Hook para scroll infinito corrigido
import { useEffect, useCallback, useState, useRef } from 'react';

// Interfaces
interface InfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  triggerElement?: Element | null;
  enabled?: boolean;
  onError?: (error: Error) => void;
  debounceMs?: number;
}

interface InfiniteScrollState {
  isNearEnd: boolean;
  lastTriggerTime: number;
  triggerCount: number;
  error: Error | null;
}

interface InfiniteScrollStats {
  totalTriggers: number;
  lastTriggerTime: number;
  averageTimeBetweenTriggers: number;
}

interface InfiniteScrollConfig {
  threshold: number;
  rootMargin: string;
  enabled: boolean;
  debounceMs: number;
  usingIntersectionObserver: boolean;
}

export const useInfiniteScroll = (
  callback: () => void | Promise<void>,
  hasMore: boolean,
  loading: boolean,
  options: InfiniteScrollOptions = {}
) => {
  // Configurações padrão
  const {
    threshold = 100,
    rootMargin = '0px',
    triggerElement = null,
    enabled = true,
    onError,
    debounceMs = 200
  } = options;

  // Estados
  const [state, setState] = useState<InfiniteScrollState>({
    isNearEnd: false,
    lastTriggerTime: 0,
    triggerCount: 0,
    error: null
  });

  // Refs
  const callbackRef = useRef(callback);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isExecutingRef = useRef(false);

  // Atualizar callback ref
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // ✅ FUNÇÃO PARA VERIFICAR SE DEVE FAZER SCROLL INFINITO
  const shouldTrigger = useCallback(() => {
    if (!enabled || loading || !hasMore || isExecutingRef.current) {
      return false;
    }

    // Debounce: evitar triggers muito frequentes
    const now = Date.now();
    if (now - state.lastTriggerTime < debounceMs) {
      return false;
    }

    return true;
  }, [enabled, loading, hasMore, debounceMs, state.lastTriggerTime]);

  // ✅ EXECUTAR CALLBACK COM TRATAMENTO DE ERROS
  const executeCallback = useCallback(async () => {
    if (!shouldTrigger()) return;

    try {
      isExecutingRef.current = true;
      
      setState(prev => ({
        ...prev,
        lastTriggerTime: Date.now(),
        triggerCount: prev.triggerCount + 1,
        error: null,
        isNearEnd: true
      }));

      await callbackRef.current();
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro no scroll infinito');
      
      setState(prev => ({ ...prev, error: err }));
      onError?.(err);
      
      console.error('❌ Erro no infinite scroll:', err);
    } finally {
      isExecutingRef.current = false;
      
      // Reset isNearEnd após um tempo
      setTimeout(() => {
        setState(prev => ({ ...prev, isNearEnd: false }));
      }, 1000);
    }
  }, [shouldTrigger, onError]);

  // ✅ SCROLL BASEADO EM POSIÇÃO (MÉTODO CLÁSSICO)
  const handleScroll = useCallback(() => {
    if (!shouldTrigger()) return;

    // Limpar timeout anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce
    debounceTimeoutRef.current = setTimeout(() => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      if (distanceFromBottom <= threshold) {
        executeCallback();
      }
    }, debounceMs);
  }, [shouldTrigger, threshold, debounceMs, executeCallback]);

  // ✅ INTERSECTION OBSERVER (MÉTODO MODERNO)
  const setupIntersectionObserver = useCallback(() => {
    if (!window.IntersectionObserver || !triggerElement) {
      return null;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        
        if (entry.isIntersecting && shouldTrigger()) {
          executeCallback();
        }
      },
      {
        root: null,
        rootMargin,
        threshold: 0.1
      }
    );

    observer.observe(triggerElement);
    return observer;
  }, [triggerElement, rootMargin, shouldTrigger, executeCallback]);

  // ✅ TRIGGER MANUAL
  const triggerLoad = useCallback(() => {
    if (shouldTrigger()) {
      executeCallback();
    }
  }, [shouldTrigger, executeCallback]);

  // ✅ RESET DE ESTADO
  const reset = useCallback(() => {
    setState({
      isNearEnd: false,
      lastTriggerTime: 0,
      triggerCount: 0,
      error: null
    });
    isExecutingRef.current = false;
  }, []);

  // ✅ SETUP DOS LISTENERS
  useEffect(() => {
    if (!enabled) return;

    // Se há um elemento trigger específico, usar Intersection Observer
    if (triggerElement && window.IntersectionObserver) {
      observerRef.current = setupIntersectionObserver();
    } else {
      // Caso contrário, usar scroll clássico
      const handleScrollThrottled = handleScroll;
      window.addEventListener('scroll', handleScrollThrottled, { passive: true });
      
      return () => {
        window.removeEventListener('scroll', handleScrollThrottled);
      };
    }

    // Cleanup do observer
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [enabled, triggerElement, setupIntersectionObserver, handleScroll]);

  // ✅ CLEANUP GERAL
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // ✅ DETECTAR MUDANÇAS NAS DEPENDÊNCIAS
  useEffect(() => {
    // Reset quando hasMore muda para true (nova busca)
    if (hasMore && state.triggerCount > 0) {
      reset();
    }
  }, [hasMore, reset, state.triggerCount]);

  // ✅ GERAR ESTATÍSTICAS
  const getStats = useCallback((): InfiniteScrollStats => {
    return {
      totalTriggers: state.triggerCount,
      lastTriggerTime: state.lastTriggerTime,
      averageTimeBetweenTriggers: state.triggerCount > 1 
        ? (Date.now() - state.lastTriggerTime) / state.triggerCount 
        : 0
    };
  }, [state.triggerCount, state.lastTriggerTime]);

  // ✅ GERAR CONFIGURAÇÕES ATUAIS
  const getConfig = useCallback((): InfiniteScrollConfig => {
    return {
      threshold,
      rootMargin,
      enabled,
      debounceMs,
      usingIntersectionObserver: !!triggerElement && !!window.IntersectionObserver
    };
  }, [threshold, rootMargin, enabled, debounceMs, triggerElement]);

  return {
    // Estado atual
    ...state,
    
    // Informações úteis
    canTrigger: shouldTrigger(),
    isEnabled: enabled,
    isExecuting: isExecutingRef.current,
    
    // Funções de controle
    triggerLoad,
    reset,
    
    // Informações de debug
    stats: getStats(),
    config: getConfig()
  };
};

// ✅ HOOK ESPECIALIZADO PARA LISTAS DE PRODUTOS
export const useProductInfiniteScroll = (
  loadMoreProducts: () => Promise<void>,
  hasMoreProducts: boolean,
  isLoading: boolean,
  options?: {
    pageSize?: number;
    preloadThreshold?: number;
    maxPages?: number;
  }
) => {
  const [loadedPages, setLoadedPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  
  const {
    pageSize = 20,
    preloadThreshold = 3,
    maxPages = 50
  } = options || {};

  const canLoadMore = hasMoreProducts && loadedPages < maxPages;
  
  const loadMore = useCallback(async () => {
    if (!canLoadMore || isLoading) return;
    
    try {
      await loadMoreProducts();
      setLoadedPages(prev => prev + 1);
      setTotalProducts(prev => prev + pageSize);
    } catch (error) {
      console.error('❌ Erro ao carregar mais produtos:', error);
    }
  }, [canLoadMore, isLoading, loadMoreProducts, pageSize]);

  const infiniteScroll = useInfiniteScroll(
    loadMore,
    canLoadMore,
    isLoading,
    {
      threshold: 100 * preloadThreshold,
      enabled: true,
      debounceMs: 300
    }
  );

  const reset = useCallback(() => {
    setLoadedPages(1);
    setTotalProducts(0);
    infiniteScroll.reset();
  }, [infiniteScroll]);

  return {
    ...infiniteScroll,
    loadedPages,
    totalProducts,
    estimatedTotalProducts: totalProducts + (canLoadMore ? pageSize : 0),
    progressPercentage: maxPages > 0 ? (loadedPages / maxPages) * 100 : 0,
    reset,
    canLoadMore,
    reachedMaxPages: loadedPages >= maxPages
  };
};

// ✅ HOOK PARA SCROLL INFINITO COM CACHE
export const useCachedInfiniteScroll = <T>(
  fetcher: (page: number) => Promise<T[]>,
  cacheKey: string,
  options?: {
    pageSize?: number;
    maxCacheAge?: number;
  }
) => {
  const [cache, setCache] = useState<Map<number, { data: T[]; timestamp: number }>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [allItems, setAllItems] = useState<T[]>([]);

  const { pageSize = 20, maxCacheAge = 5 * 60 * 1000 } = options || {}; // 5 min cache

  const loadPage = useCallback(async (page: number) => {
    // Verificar cache
    const cached = cache.get(page);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < maxCacheAge) {
      return cached.data;
    }

    // Buscar dados
    try {
      const data = await fetcher(page);
      
      // Salvar no cache
      setCache(prev => new Map(prev).set(page, { data, timestamp: now }));
      
      return data;
    } catch (error) {
      console.error(`❌ Erro ao carregar página ${page}:`, error);
      throw error;
    }
  }, [cache, fetcher, maxCacheAge]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    try {
      const data = await loadPage(currentPage);
      
      if (data.length === 0 || data.length < pageSize) {
        setHasMore(false);
      }
      
      setAllItems(prev => [...prev, ...data]);
      setCurrentPage(prev => prev + 1);
      
    } catch (error) {
      console.error('❌ Erro no loadMore:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, currentPage, loadPage, pageSize]);

  const infiniteScroll = useInfiniteScroll(loadMore, hasMore, isLoading);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setAllItems([]);
    setHasMore(true);
    setCache(new Map());
    infiniteScroll.reset();
  }, [infiniteScroll]);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  return {
    ...infiniteScroll,
    items: allItems,
    isLoading,
    hasMore,
    currentPage,
    cacheSize: cache.size,
    reset,
    clearCache,
    reloadCurrentPage: () => loadPage(currentPage - 1)
  };
};