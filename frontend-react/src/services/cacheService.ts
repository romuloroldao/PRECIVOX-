// services/cacheService.ts - SISTEMA DE CACHE INTELIGENTE PARA APIs
import { Product } from '../types/product';

interface CacheConfig {
  ttl: number; // Time to live em milliseconds
  maxSize: number; // Número máximo de entradas
  storage: 'memory' | 'localStorage' | 'sessionStorage';
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  key: string;
  hits: number;
  size: number;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  hits: number;
  misses: number;
  oldestEntry: number;
  newestEntry: number;
}

class CacheService {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    creates: 0
  };

  // ✅ CONFIGURAÇÕES DE CACHE POR TIPO
  private configs: Record<string, CacheConfig> = {
    products: {
      ttl: 5 * 60 * 1000, // 5 minutos
      maxSize: 100,
      storage: 'memory'
    },
    user: {
      ttl: 15 * 60 * 1000, // 15 minutos
      maxSize: 10,
      storage: 'localStorage'
    },
    location: {
      ttl: 30 * 60 * 1000, // 30 minutos
      maxSize: 5,
      storage: 'localStorage'
    },
    analytics: {
      ttl: 60 * 60 * 1000, // 1 hora
      maxSize: 50,
      storage: 'sessionStorage'
    },
    search: {
      ttl: 2 * 60 * 1000, // 2 minutos
      maxSize: 200,
      storage: 'memory'
    }
  };

  // ✅ DEFINIR CACHE COM TIPO E CONFIGURAÇÃO
  set<T>(type: string, key: string, data: T, customTTL?: number): void {
    const config = this.configs[type] || this.configs.products;
    const ttl = customTTL || config.ttl;
    const fullKey = `${type}:${key}`;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
      key: fullKey,
      hits: 0,
      size: this.calculateSize(data)
    };

    // Verificar se precisa fazer limpeza
    this.evictIfNeeded(type);

    // Salvar baseado na estratégia
    switch (config.storage) {
      case 'memory':
        this.memoryCache.set(fullKey, entry);
        break;
      case 'localStorage':
        try {
          localStorage.setItem(fullKey, JSON.stringify(entry));
        } catch (e) {
          console.warn('⚠️ localStorage cheio, usando memória:', e);
          this.memoryCache.set(fullKey, entry);
        }
        break;
      case 'sessionStorage':
        try {
          sessionStorage.setItem(fullKey, JSON.stringify(entry));
        } catch (e) {
          console.warn('⚠️ sessionStorage cheio, usando memória:', e);
          this.memoryCache.set(fullKey, entry);
        }
        break;
    }

    this.stats.creates++;
    console.log(`💾 Cache set: ${fullKey} (TTL: ${ttl/1000}s)`);
  }

  // ✅ OBTER DO CACHE COM VALIDAÇÃO DE EXPIRAÇÃO
  get<T>(type: string, key: string): T | null {
    const config = this.configs[type] || this.configs.products;
    const fullKey = `${type}:${key}`;
    let entry: CacheEntry<T> | null = null;

    // Buscar baseado na estratégia
    switch (config.storage) {
      case 'memory':
        entry = this.memoryCache.get(fullKey) || null;
        break;
      case 'localStorage':
        try {
          const stored = localStorage.getItem(fullKey);
          entry = stored ? JSON.parse(stored) : null;
        } catch (e) {
          console.warn('⚠️ Erro ao ler localStorage:', e);
        }
        break;
      case 'sessionStorage':
        try {
          const stored = sessionStorage.getItem(fullKey);
          entry = stored ? JSON.parse(stored) : null;
        } catch (e) {
          console.warn('⚠️ Erro ao ler sessionStorage:', e);
        }
        break;
    }

    if (!entry) {
      this.stats.misses++;
      console.log(`❌ Cache miss: ${fullKey}`);
      return null;
    }

    // Verificar expiração
    if (Date.now() > entry.expiry) {
      this.delete(type, key);
      this.stats.misses++;
      console.log(`⏰ Cache expirado: ${fullKey}`);
      return null;
    }

    // Incrementar hits
    entry.hits++;
    this.stats.hits++;
    
    // Atualizar entry com novo hit count
    this.updateEntry(type, fullKey, entry, config.storage);
    
    console.log(`✅ Cache hit: ${fullKey} (hits: ${entry.hits})`);
    return entry.data;
  }

  // ✅ DELETAR ENTRADA ESPECÍFICA
  delete(type: string, key: string): boolean {
    const config = this.configs[type] || this.configs.products;
    const fullKey = `${type}:${key}`;

    switch (config.storage) {
      case 'memory':
        return this.memoryCache.delete(fullKey);
      case 'localStorage':
        localStorage.removeItem(fullKey);
        return true;
      case 'sessionStorage':
        sessionStorage.removeItem(fullKey);
        return true;
    }
  }

  // ✅ LIMPAR CACHE POR TIPO
  clear(type?: string): void {
    if (type) {
      const config = this.configs[type];
      const prefix = `${type}:`;

      switch (config?.storage) {
        case 'memory':
          for (const key of this.memoryCache.keys()) {
            if (key.startsWith(prefix)) {
              this.memoryCache.delete(key);
            }
          }
          break;
        case 'localStorage':
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key?.startsWith(prefix)) {
              localStorage.removeItem(key);
            }
          }
          break;
        case 'sessionStorage':
          for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const key = sessionStorage.key(i);
            if (key?.startsWith(prefix)) {
              sessionStorage.removeItem(key);
            }
          }
          break;
      }
    } else {
      // Limpar tudo
      this.memoryCache.clear();
      this.clearStorageByPrefix('');
    }

    console.log(`🗑️ Cache limpo: ${type || 'todos'}`);
  }

  // ✅ CACHE ESPECÍFICO PARA PRODUTOS COM BUSCA INTELIGENTE
  cacheProducts(products: Product[], searchTerm: string, filters?: any): void {
    const key = this.generateProductsKey(searchTerm, filters);
    this.set('products', key, {
      products,
      searchTerm,
      filters,
      count: products.length,
      cached_at: new Date().toISOString()
    });
  }

  getCachedProducts(searchTerm: string, filters?: any): Product[] | null {
    const key = this.generateProductsKey(searchTerm, filters);
    const cached = this.get<{
      products: Product[];
      searchTerm: string;
      filters: any;
      count: number;
      cached_at: string;
    }>('products', key);

    return cached ? cached.products : null;
  }

  // ✅ CACHE PARA RESULTADOS DE BUSCA COM AUTOCOMPLETE
  cacheSearchSuggestions(term: string, suggestions: string[]): void {
    const key = `suggestions_${term.toLowerCase()}`;
    this.set('search', key, suggestions, 10 * 60 * 1000); // 10 minutos
  }

  getCachedSearchSuggestions(term: string): string[] | null {
    const key = `suggestions_${term.toLowerCase()}`;
    return this.get<string[]>('search', key);
  }

  // ✅ CACHE PARA DADOS DE USUÁRIO
  cacheUserData(userId: string, userData: any): void {
    this.set('user', userId, userData);
  }

  getCachedUserData(userId: string): any | null {
    return this.get('user', userId);
  }

  // ✅ CACHE PARA LOCALIZAÇÃO
  cacheLocation(location: any): void {
    this.set('location', 'current', location);
  }

  getCachedLocation(): any | null {
    return this.get('location', 'current');
  }

  // ✅ CACHE PARA ANALYTICS
  cacheAnalytics(key: string, data: any): void {
    this.set('analytics', key, data);
  }

  getCachedAnalytics(key: string): any | null {
    return this.get('analytics', key);
  }

  // ✅ INVALIDAR CACHE BASEADO EM CONDIÇÕES
  invalidateByPattern(pattern: RegExp): void {
    // Memory cache
    for (const key of this.memoryCache.keys()) {
      if (pattern.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && pattern.test(key)) {
        localStorage.removeItem(key);
      }
    }

    // sessionStorage
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && pattern.test(key)) {
        sessionStorage.removeItem(key);
      }
    }

    console.log(`🔄 Cache invalidado por padrão: ${pattern}`);
  }

  // ✅ ESTATÍSTICAS DO CACHE
  getStats(): CacheStats {
    const totalHits = this.stats.hits;
    const totalMisses = this.stats.misses;
    const hitRate = totalHits + totalMisses > 0 ? (totalHits / (totalHits + totalMisses)) * 100 : 0;

    let totalEntries = this.memoryCache.size;
    let totalSize = 0;
    let oldest = Date.now();
    let newest = 0;

    // Calcular estatísticas do memory cache
    for (const entry of this.memoryCache.values()) {
      totalSize += entry.size;
      oldest = Math.min(oldest, entry.timestamp);
      newest = Math.max(newest, entry.timestamp);
    }

    return {
      totalEntries,
      totalSize,
      hitRate,
      hits: totalHits,
      misses: totalMisses,
      oldestEntry: oldest,
      newestEntry: newest
    };
  }

  // ✅ HELPERS PRIVADOS
  private generateProductsKey(searchTerm: string, filters?: any): string {
    const filterStr = filters ? JSON.stringify(filters) : '';
    return `${searchTerm.toLowerCase().trim()}_${btoa(filterStr).slice(0, 10)}`;
  }

  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 1000; // Estimativa conservadora
    }
  }

  private evictIfNeeded(type: string): void {
    const config = this.configs[type];
    if (!config) return;

    if (config.storage === 'memory') {
      const typeEntries = Array.from(this.memoryCache.entries())
        .filter(([key]) => key.startsWith(`${type}:`));

      if (typeEntries.length >= config.maxSize) {
        // Remover entrada mais antiga com menos hits
        const toEvict = typeEntries
          .sort((a, b) => {
            const hitsDiff = a[1].hits - b[1].hits;
            return hitsDiff !== 0 ? hitsDiff : a[1].timestamp - b[1].timestamp;
          })[0];

        this.memoryCache.delete(toEvict[0]);
        this.stats.evictions++;
        console.log(`🗑️ Evicted cache entry: ${toEvict[0]}`);
      }
    }
  }

  private updateEntry(type: string, fullKey: string, entry: CacheEntry<any>, storage: string): void {
    switch (storage) {
      case 'memory':
        this.memoryCache.set(fullKey, entry);
        break;
      case 'localStorage':
        try {
          localStorage.setItem(fullKey, JSON.stringify(entry));
        } catch (e) {
          // Ignorar se falhar
        }
        break;
      case 'sessionStorage':
        try {
          sessionStorage.setItem(fullKey, JSON.stringify(entry));
        } catch (e) {
          // Ignorar se falhar
        }
        break;
    }
  }

  private clearStorageByPrefix(prefix: string): void {
    // localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    }

    // sessionStorage
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(prefix)) {
        sessionStorage.removeItem(key);
      }
    }
  }
}

// ✅ INSTANCE SINGLETON
export const cacheService = new CacheService();

// ✅ HOOK PARA USO EM COMPONENTES
export const useCache = () => {
  return {
    // Produtos
    cacheProducts: (products: Product[], searchTerm: string, filters?: any) => 
      cacheService.cacheProducts(products, searchTerm, filters),
    getCachedProducts: (searchTerm: string, filters?: any) => 
      cacheService.getCachedProducts(searchTerm, filters),
    
    // Busca
    cacheSearchSuggestions: (term: string, suggestions: string[]) =>
      cacheService.cacheSearchSuggestions(term, suggestions),
    getCachedSearchSuggestions: (term: string) =>
      cacheService.getCachedSearchSuggestions(term),
    
    // Usuário
    cacheUserData: (userId: string, userData: any) =>
      cacheService.cacheUserData(userId, userData),
    getCachedUserData: (userId: string) =>
      cacheService.getCachedUserData(userId),
    
    // Localização
    cacheLocation: (location: any) =>
      cacheService.cacheLocation(location),
    getCachedLocation: () =>
      cacheService.getCachedLocation(),
    
    // Analytics
    cacheAnalytics: (key: string, data: any) =>
      cacheService.cacheAnalytics(key, data),
    getCachedAnalytics: (key: string) =>
      cacheService.getCachedAnalytics(key),
    
    // Operações gerais
    clear: (type?: string) => cacheService.clear(type),
    invalidateByPattern: (pattern: RegExp) => cacheService.invalidateByPattern(pattern),
    getStats: () => cacheService.getStats()
  };
};

export default cacheService;