// hooks/usePerformanceOptimization.ts - HOOK DE OTIMIZAÇÃO DE PERFORMANCE
import { useEffect, useCallback, useRef, useState } from 'react';
import { performanceService } from '../services/performanceService';

interface PerformanceState {
  isLoading: boolean;
  loadTime: number;
  memoryUsage: number;
  cacheStats: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  };
}

export const usePerformanceOptimization = () => {
  const [performanceState, setPerformanceState] = useState<PerformanceState>({
    isLoading: false,
    loadTime: 0,
    memoryUsage: 0,
    cacheStats: { hits: 0, misses: 0, hitRate: 0, size: 0 }
  });

  const startTimeRef = useRef<number>(0);

  // ✅ INICIALIZAR MONITORAMENTO DE PERFORMANCE
  useEffect(() => {
    performanceService.startPerformanceMonitoring();
    
    // Atualizar métricas periodicamente
    const interval = setInterval(() => {
      const stats = performanceService.getPerformanceStats();
      setPerformanceState(prev => ({
        ...prev,
        loadTime: stats.loadTime,
        memoryUsage: stats.memoryUsage,
        cacheStats: stats.cache
      }));
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  // ✅ MARCAR INÍCIO DE OPERAÇÃO
  const startOperation = useCallback(() => {
    startTimeRef.current = performance.now();
    setPerformanceState(prev => ({ ...prev, isLoading: true }));
  }, []);

  // ✅ MARCAR FIM DE OPERAÇÃO
  const endOperation = useCallback((operationName?: string) => {
    const endTime = performance.now();
    const duration = endTime - startTimeRef.current;
    
    setPerformanceState(prev => ({ 
      ...prev, 
      isLoading: false,
      loadTime: duration 
    }));

    if (operationName) {
      console.log(`⏱️ ${operationName} concluída em ${duration.toFixed(2)}ms`);
    }
  }, []);

  // ✅ CACHE INTELIGENTE PARA PRODUTOS
  const cacheProducts = useCallback((products: any[], searchTerm: string) => {
    performanceService.cacheProducts(products, searchTerm);
  }, []);

  const getCachedProducts = useCallback((searchTerm: string) => {
    return performanceService.getCachedProducts(searchTerm);
  }, []);

  // ✅ CACHE PARA DADOS DO USUÁRIO
  const cacheUserData = useCallback((userData: any) => {
    performanceService.cacheUserData(userData);
  }, []);

  const getCachedUserData = useCallback(() => {
    return performanceService.getCachedUserData();
  }, []);

  // ✅ CACHE PARA LOCALIZAÇÃO
  const cacheLocation = useCallback((location: any) => {
    performanceService.cacheLocation(location);
  }, []);

  const getCachedLocation = useCallback(() => {
    return performanceService.getCachedLocation();
  }, []);

  // ✅ DEBOUNCED SEARCH
  const createDebouncedSearch = useCallback((searchFn: (term: string) => void, delay: number = 300) => {
    return (performanceService.constructor as any).debounce(searchFn, delay);
  }, []);

  // ✅ THROTTLED SCROLL
  const createThrottledScroll = useCallback((scrollFn: () => void, delay: number = 100) => {
    return (performanceService.constructor as any).throttle(scrollFn, delay);
  }, []);

  // ✅ PRELOAD DE IMAGENS
  const preloadImages = useCallback(async (urls: string[]) => {
    startOperation();
    try {
      await performanceService.preloadImages(urls);
      endOperation('Preload de imagens');
    } catch (error) {
      console.error('❌ Erro no preload de imagens:', error);
      endOperation();
    }
  }, [startOperation, endOperation]);

  // ✅ VIRTUAL SCROLLING CALCULATION
  const calculateVirtualItems = useCallback((
    itemHeight: number,
    containerHeight: number,
    scrollTop: number,
    totalItems: number,
    overscan: number = 5
  ) => {
    return performanceService.calculateVirtualItems(
      itemHeight,
      containerHeight,
      scrollTop,
      totalItems,
      overscan
    );
  }, []);

  // ✅ LIMPAR CACHE
  const clearCache = useCallback(() => {
    performanceService.clearCache();
    // Atualizar estado após limpeza
    const stats = performanceService.getPerformanceStats();
    setPerformanceState(prev => ({
      ...prev,
      cacheStats: stats.cache
    }));
  }, []);

  // ✅ OBTER ESTATÍSTICAS COMPLETAS
  const getPerformanceStats = useCallback(() => {
    return performanceService.getPerformanceStats();
  }, []);

  return {
    // Estado
    ...performanceState,
    
    // Operações
    startOperation,
    endOperation,
    
    // Cache
    cacheProducts,
    getCachedProducts,
    cacheUserData,
    getCachedUserData,
    cacheLocation,
    getCachedLocation,
    clearCache,
    
    // Otimizações
    createDebouncedSearch,
    createThrottledScroll,
    preloadImages,
    calculateVirtualItems,
    
    // Métricas
    getPerformanceStats
  };
};

// ✅ HOOK PARA LAZY LOADING DE COMPONENTES
export const useLazyComponent = <T>(importFn: () => Promise<{ default: T }>) => {
  const [component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadComponent = useCallback(async () => {
    if (component || loading) return component;

    setLoading(true);
    setError(null);

    try {
      const loadedComponent = await (performanceService.constructor as any).loadComponent(importFn);
      setComponent(loadedComponent);
      return loadedComponent;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [component, loading, importFn]);

  return {
    component,
    loading,
    error,
    loadComponent
  };
};

// ✅ HOOK PARA VIRTUAL SCROLLING
export const useVirtualScroll = (
  itemHeight: number,
  totalItems: number,
  containerRef: React.RefObject<HTMLElement>
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      setContainerHeight(container.clientHeight);
    };

    const handleScroll = (performanceService.constructor as any).throttle(() => {
      setScrollTop(container.scrollTop);
    }, 16); // ~60fps

    updateDimensions();
    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateDimensions);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateDimensions);
    };
  }, [containerRef]);

  const virtualItems = performanceService.calculateVirtualItems(
    itemHeight,
    containerHeight,
    scrollTop,
    totalItems
  );

  return {
    ...virtualItems,
    totalHeight: totalItems * itemHeight,
    containerHeight,
    scrollTop
  };
};

export default usePerformanceOptimization;