// services/dataAdapter.ts - Adaptador unificado para multi-source e JSON local
import { useMultiSourceData } from '../hooks/useMultiSourceData';
import { useProductData } from '../hooks/useProductData';
import { Product, DataAdapterConfig, UnifiedDataReturn, DataSourceType } from '../types/product';

// ✅ HOOK ADAPTADOR UNIFICADO
export function useUnifiedProductData(config: DataAdapterConfig = {}): UnifiedDataReturn {
  const {
    useMultiSource = true,
    fallbackToLocal = true,
    preferredMarkets = [],
    enableCache = true
  } = config;

  // Hooks condicionais - precauções para SSR
  const multiSourceData = useMultiSource ? useMultiSourceData() : null;
  const localData = useProductData();

  // ✅ DETERMINAR FONTE DE DADOS ATIVA
  const getActiveDataSource = (): DataSourceType => {
    if (useMultiSource && multiSourceData && !multiSourceData.error) {
      if (fallbackToLocal && localData.products.length > 0) {
        return 'hybrid';
      }
      return 'multi-source';
    }
    return 'local';
  };

  const activeSource = getActiveDataSource();
  const isMultiSourceEnabled = useMultiSource && multiSourceData !== null;

  // ✅ SELEÇÃO DE DADOS BASEADA NA FONTE ATIVA
  const activeData = (() => {
    switch (activeSource) {
      case 'multi-source':
        return multiSourceData!;
      case 'hybrid':
        // Combinar dados multi-source com fallback local
        return {
          ...multiSourceData!,
          products: multiSourceData!.products.length > 0 ? multiSourceData!.products : localData.products,
          allProducts: multiSourceData!.allProducts.length > 0 ? multiSourceData!.allProducts : localData.allProducts,
          categories: multiSourceData!.categories.length > 0 ? multiSourceData!.categories : localData.categories,
          error: multiSourceData!.error || localData.error
        };
      case 'local':
      default:
        return localData;
    }
  })();

  // ✅ FUNÇÃO DE BUSCA UNIFICADA
  const unifiedSearchProducts = async (query: string): Promise<Product[]> => {
    console.log(`🔍 Busca unificada (${activeSource}): "${query}"`);

    try {
      if (activeSource === 'multi-source' && multiSourceData) {
        // Usar busca multi-source com mercados preferenciais
        return await multiSourceData.searchMultiSource(query, preferredMarkets.length > 0 ? preferredMarkets : undefined);
      } else if (activeSource === 'hybrid' && multiSourceData) {
        // Tentar multi-source primeiro, fallback para local
        try {
          const multiResults = await multiSourceData.searchMultiSource(query, preferredMarkets.length > 0 ? preferredMarkets : undefined);
          if (multiResults.length > 0) {
            return multiResults;
          }
        } catch (err) {
          console.warn('⚠️ Multi-source falhou, usando fallback local:', err);
        }
      }
      
      // Fallback para busca local
      return await localData.searchProducts(query);
    } catch (error) {
      console.error('❌ Erro na busca unificada:', error);
      throw error;
    }
  };

  // ✅ FUNÇÃO DE CATEGORIA UNIFICADA
  const unifiedLoadProductsByCategory = async (categoryId: string): Promise<Product[]> => {
    console.log(`📂 Carregamento de categoria unificado (${activeSource}): ${categoryId}`);

    try {
      if (activeSource === 'multi-source' && multiSourceData) {
        return await multiSourceData.loadProductsByCategory(categoryId);
      } else if (activeSource === 'hybrid' && multiSourceData) {
        try {
          const multiResults = await multiSourceData.loadProductsByCategory(categoryId);
          if (multiResults.length > 0) {
            return multiResults;
          }
        } catch (err) {
          console.warn('⚠️ Multi-source categoria falhou, usando fallback local:', err);
        }
      }
      
      return await localData.loadProductsByCategory(categoryId);
    } catch (error) {
      console.error('❌ Erro no carregamento de categoria unificado:', error);
      throw error;
    }
  };

  // ✅ FUNÇÃO DE CARREGAMENTO UNIFICADA
  const unifiedLoadProducts = async (): Promise<void> => {
    console.log(`🚀 Carregamento unificado (${activeSource})`);

    try {
      if (activeSource === 'multi-source' && multiSourceData) {
        await multiSourceData.loadProducts();
      } else if (activeSource === 'hybrid') {
        // Carregar ambos em paralelo
        await Promise.allSettled([
          multiSourceData?.loadProducts(),
          localData.loadProducts()
        ]);
      } else {
        await localData.loadProducts();
      }
    } catch (error) {
      console.error('❌ Erro no carregamento unificado:', error);
      throw error;
    }
  };

  // ✅ FUNÇÃO DE RELOAD UNIFICADA
  const unifiedReloadData = async (): Promise<void> => {
    console.log(`🔄 Reload unificado (${activeSource})`);

    try {
      if (activeSource === 'multi-source' && multiSourceData) {
        await multiSourceData.reloadData();
      } else if (activeSource === 'hybrid') {
        await Promise.allSettled([
          multiSourceData?.reloadData(),
          localData.reloadData()
        ]);
      } else {
        await localData.reloadData();
      }
    } catch (error) {
      console.error('❌ Erro no reload unificado:', error);
      throw error;
    }
  };

  // ✅ FUNÇÃO DE LIMPEZA DE CACHE UNIFICADA
  const unifiedClearCache = (): void => {
    console.log(`🗑️ Limpeza de cache unificada (${activeSource})`);

    if (enableCache) {
      if (multiSourceData) {
        multiSourceData.clearCache();
      }
      localData.clearCache();
    }
  };

  // ✅ SUGESTÕES INTELIGENTES UNIFICADAS
  const unifiedGetSmartSuggestions = (query?: string): string[] => {
    if (activeSource === 'multi-source' && multiSourceData) {
      return multiSourceData.getSmartSuggestions(query);
    } else if (activeSource === 'hybrid' && multiSourceData) {
      const multiSuggestions = multiSourceData.getSmartSuggestions(query);
      if (multiSuggestions.length > 0) {
        return multiSuggestions;
      }
    }
    
    return localData.getSmartSuggestions(query);
  };

  // ✅ RETORNO UNIFICADO
  const unifiedReturn: UnifiedDataReturn = {
    // Dados principais
    products: activeData.products,
    allProducts: activeData.allProducts,
    categories: activeData.categories,
    markets: activeData.markets,
    brands: activeData.brands,
    loading: activeData.loading,
    error: activeData.error,
    searchTerm: activeData.searchTerm,
    setSearchTerm: activeData.setSearchTerm,

    // Funções unificadas
    searchProducts: unifiedSearchProducts,
    loadProductsByCategory: unifiedLoadProductsByCategory,
    loadProducts: unifiedLoadProducts,
    reloadData: unifiedReloadData,
    clearCache: unifiedClearCache,
    getSmartSuggestions: unifiedGetSmartSuggestions,

    // Funções multi-source (se disponível)
    ...(multiSourceData && {
      searchMultiSource: multiSourceData.searchMultiSource,
      loadMarketProducts: multiSourceData.loadMarketProducts,
      getMultiSourceStats: multiSourceData.getMultiSourceStats,
      lastQuery: multiSourceData.lastQuery
    }),

    // Metadata
    dataSource: activeSource,
    isMultiSourceEnabled
  };

  return unifiedReturn;
}

// ✅ CONFIGURAÇÕES PRÉ-DEFINIDAS
export const DataAdapterPresets = {
  // Apenas multi-source
  multiSourceOnly: (): DataAdapterConfig => ({
    useMultiSource: true,
    fallbackToLocal: false,
    enableCache: true
  }),

  // Apenas local
  localOnly: (): DataAdapterConfig => ({
    useMultiSource: false,
    fallbackToLocal: false,
    enableCache: true
  }),

  // Híbrido com fallback
  hybrid: (preferredMarkets: string[] = []): DataAdapterConfig => ({
    useMultiSource: true,
    fallbackToLocal: true,
    preferredMarkets,
    enableCache: true
  }),

  // Configuração para mercados específicos
  marketSpecific: (markets: string[]): DataAdapterConfig => ({
    useMultiSource: true,
    fallbackToLocal: true,
    preferredMarkets: markets,
    enableCache: true
  })
};

export default useUnifiedProductData;