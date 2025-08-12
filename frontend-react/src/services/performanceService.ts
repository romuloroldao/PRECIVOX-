// services/performanceService.ts - SERVIÇO DE OTIMIZAÇÃO DE PERFORMANCE
import { Product } from '../types/product';

// Interface para métricas de performance
interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  apiCallsCount: number;
  cacheHits: number;
  cacheMisses: number;
}

// Interface para cache de API
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  key: string;
}

// Configurações de cache
const CACHE_CONFIG = {
  PRODUCTS: 5 * 60 * 1000, // 5 minutos
  USER_DATA: 15 * 60 * 1000, // 15 minutos
  LOCATION: 30 * 60 * 1000, // 30 minutos
  ANALYTICS: 60 * 60 * 1000, // 1 hora
  MAX_ENTRIES: 100
};

class PerformanceService {
  private cache = new Map<string, CacheEntry<any>>();
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    apiCallsCount: 0,
    cacheHits: 0,
    cacheMisses: 0
  };

  // ✅ LAZY LOADING DE COMPONENTES
  static async loadComponent<T>(importFn: () => Promise<{ default: T }>): Promise<T> {
    const start = performance.now();
    
    try {
      const module = await importFn();
      const end = performance.now();
      
      console.log(`🚀 Componente carregado em ${(end - start).toFixed(2)}ms`);
      return module.default;
    } catch (error) {
      console.error('❌ Erro ao carregar componente:', error);
      throw error;
    }
  }

  // ✅ SISTEMA DE CACHE INTELIGENTE
  setCache<T>(key: string, data: T, customExpiry?: number): void {
    // Limpar cache se atingir limite
    if (this.cache.size >= CACHE_CONFIG.MAX_ENTRIES) {
      this.clearOldestEntries(20);
    }

    const expiry = customExpiry || CACHE_CONFIG.PRODUCTS;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry,
      key
    };

    this.cache.set(key, entry);
    console.log(`💾 Cache salvo: ${key} (expira em ${expiry/1000}s)`);
  }

  getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.cacheMisses++;
      console.log(`❌ Cache miss: ${key}`);
      return null;
    }

    // Verificar se expirou
    if (Date.now() > entry.timestamp + entry.expiry) {
      this.cache.delete(key);
      this.metrics.cacheMisses++;
      console.log(`⏰ Cache expirado: ${key}`);
      return null;
    }

    this.metrics.cacheHits++;
    console.log(`✅ Cache hit: ${key}`);
    return entry.data;
  }

  // ✅ CACHE ESPECÍFICO PARA PRODUTOS
  cacheProducts(products: Product[], searchTerm: string): void {
    const key = `products_${searchTerm.toLowerCase().trim()}`;
    this.setCache(key, products, CACHE_CONFIG.PRODUCTS);
  }

  getCachedProducts(searchTerm: string): Product[] | null {
    const key = `products_${searchTerm.toLowerCase().trim()}`;
    return this.getCache<Product[]>(key);
  }

  // ✅ CACHE PARA DADOS DO USUÁRIO
  cacheUserData(userData: any): void {
    this.setCache('user_data', userData, CACHE_CONFIG.USER_DATA);
  }

  getCachedUserData(): any | null {
    return this.getCache('user_data');
  }

  // ✅ CACHE PARA LOCALIZAÇÃO
  cacheLocation(location: any): void {
    this.setCache('user_location', location, CACHE_CONFIG.LOCATION);
  }

  getCachedLocation(): any | null {
    return this.getCache('user_location');
  }

  // ✅ DEBOUNCE PARA OTIMIZAR BUSCA
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }

  // ✅ THROTTLE PARA SCROLL E RESIZE
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        func.apply(null, args);
        lastCall = now;
      }
    };
  }

  // ✅ VIRTUAL SCROLLING HELPER
  calculateVirtualItems(
    itemHeight: number,
    containerHeight: number,
    scrollTop: number,
    totalItems: number,
    overscan: number = 5
  ) {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount, totalItems - 1);

    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex: Math.min(totalItems - 1, endIndex + overscan),
      visibleCount,
      offsetY: startIndex * itemHeight
    };
  }

  // ✅ PRELOAD DE IMAGENS CRÍTICAS
  async preloadImages(urls: string[]): Promise<void> {
    const promises = urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Falha ao carregar: ${url}`));
        img.src = url;
      });
    });

    try {
      await Promise.allSettled(promises);
      console.log(`🖼️ Preload de ${urls.length} imagens concluído`);
    } catch (error) {
      console.warn('⚠️ Algumas imagens falharam no preload:', error);
    }
  }

  // ✅ MONITORAMENTO DE PERFORMANCE
  startPerformanceMonitoring(): void {
    // Performance observer para métricas de carregamento
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const nav = entry as PerformanceNavigationTiming;
            this.metrics.loadTime = nav.loadEventEnd - nav.loadEventStart;
          }
        }
      });

      observer.observe({ entryTypes: ['navigation', 'measure'] });
    }

    // Monitorar uso de memória
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
      }, 30000); // A cada 30s
    }
  }

  // ✅ LIMPEZA DE CACHE ANTIGO
  private clearOldestEntries(count: number): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, count);

    entries.forEach(([key]) => {
      this.cache.delete(key);
    });

    console.log(`🧹 ${count} entradas antigas removidas do cache`);
  }

  // ✅ LIMPEZA COMPLETA DO CACHE
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Cache limpo completamente');
  }

  // ✅ ESTATÍSTICAS DE PERFORMANCE
  getPerformanceStats() {
    const cacheStats = {
      size: this.cache.size,
      hitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100,
      hits: this.metrics.cacheHits,
      misses: this.metrics.cacheMisses
    };

    return {
      ...this.metrics,
      cache: cacheStats,
      timestamp: new Date().toISOString()
    };
  }

  // ✅ OTIMIZAÇÃO DE BUNDLE SPLITTING
  static getChunkPriority(route: string): 'high' | 'medium' | 'low' {
    const highPriorityRoutes = ['search', 'login', 'dashboard'];
    const mediumPriorityRoutes = ['profile', 'lists', 'products'];
    
    if (highPriorityRoutes.includes(route)) return 'high';
    if (mediumPriorityRoutes.includes(route)) return 'medium';
    return 'low';
  }

  // ✅ SERVICE WORKER PARA CACHE OFFLINE
  static async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registrado:', registration);
      } catch (error) {
        console.error('❌ Falha ao registrar Service Worker:', error);
      }
    }
  }

  // ✅ INCREMENTAR CONTADORES DE MÉTRICAS
  incrementApiCall(): void {
    this.metrics.apiCallsCount++;
  }

  measureRenderTime(componentName: string, renderFn: () => void): void {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    
    console.log(`🎨 ${componentName} renderizado em ${(end - start).toFixed(2)}ms`);
    this.metrics.renderTime = end - start;
  }
}

// ✅ INSTANCE SINGLETON
export const performanceService = new PerformanceService();

// ✅ HOOKS DE PERFORMANCE
export const usePerformanceOptimization = () => {
  return {
    cacheProducts: performanceService.cacheProducts.bind(performanceService),
    getCachedProducts: performanceService.getCachedProducts.bind(performanceService),
    cacheUserData: performanceService.cacheUserData.bind(performanceService),
    getCachedUserData: performanceService.getCachedUserData.bind(performanceService),
    cacheLocation: performanceService.cacheLocation.bind(performanceService),
    getCachedLocation: performanceService.getCachedLocation.bind(performanceService),
    clearCache: performanceService.clearCache.bind(performanceService),
    getStats: performanceService.getPerformanceStats.bind(performanceService),
    preloadImages: performanceService.preloadImages.bind(performanceService)
  };
};

export default performanceService;