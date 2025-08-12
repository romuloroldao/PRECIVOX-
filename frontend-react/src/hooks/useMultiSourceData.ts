// hooks/useMultiSourceData.ts - Hook integrado com sistema multi-source
import { useState, useEffect, useCallback, useRef } from 'react';
import { multiSourceAPI, searchProductsMultiSource } from '../services/multiSourceApi';
import { Product, Category, MultiSourceResult } from '../types/product';

interface UseMultiSourceDataReturn {
  products: Product[];
  allProducts: Product[];
  categories: Category[];
  markets: string[];
  brands: string[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // Multi-source specific
  lastQuery: MultiSourceResult | null;
  searchMultiSource: (query: string, markets?: string[]) => Promise<Product[]>;
  loadMarketProducts: (marketId: string, query?: string) => Promise<Product[]>;
  clearMultiSourceCache: (marketId?: string) => void;
  getMultiSourceStats: () => any;
  
  // Legacy compatibility
  searchProducts: (query: string) => Promise<Product[]>;
  loadProductsByCategory: (categoryId: string) => Promise<Product[]>;
  loadProducts: () => Promise<void>;
  reloadData: () => Promise<void>;
  clearCache: () => void;
  getSmartSuggestions: (query?: string) => string[];
}

// ✅ PROCESSAMENTO DE DADOS MULTI-SOURCE
function processMultiSourceData(multiResult: MultiSourceResult): {
  products: Product[];
  categories: Category[];
  markets: string[];
  brands: string[];
} {
  const products = multiResult.allProducts;
  
  // Extrair categorias únicas
  const categoriesFromProducts = Array.from(new Set(products.map(p => p.categoria)));
  const categories: Category[] = categoriesFromProducts.map(catId => {
    const productCount = products.filter(p => p.categoria === catId).length;
    return {
      id: catId,
      label: catId.charAt(0).toUpperCase() + catId.slice(1),
      icon: getCategoryIcon(catId),
      count: productCount
    };
  });
  
  // Adicionar categoria "all"
  categories.unshift({
    id: 'all',
    label: 'Todas as Categorias',
    icon: '🛒',
    count: products.length
  });
  
  // Extrair mercados e marcas
  const markets = Array.from(new Set(products.map(p => p.loja).filter(Boolean)));
  const brands = Array.from(new Set(products.map(p => p.marca).filter(Boolean)));
  
  return { products, categories, markets, brands };
}

// ✅ ÍCONES DAS CATEGORIAS
function getCategoryIcon(categoria: string): string {
  const icons: Record<string, string> = {
    'bebidas': '🥤', 'carnes': '🥩', 'laticinios': '🥛', 'graos': '🌾',
    'limpeza': '🧽', 'higiene': '🧴', 'frutas': '🍎', 'verduras': '🥬',
    'hortifruti': '🥕', 'massas': '🍝', 'cafe': '☕', 'acucar': '🍯',
    'oleos': '🫒', 'biscoitos': '🍪', 'paes': '🍞', 'panificacao': '🥖',
    'congelados': '🧊', 'doces': '🍬', 'temperos': '🌿', 'enlatados': '🥫',
    'cereais': '🥣', 'petiscos': '🍿', 'pereciveis': '🥚', 'frios': '🧀',
    'salgadinhos': '🍿', 'condimentos': '🌶️'
  };
  
  return icons[categoria] || '📦';
}

// ✅ BUSCA POR CATEGORIA
function searchByCategory(products: Product[], categoryId: string): Product[] {
  if (categoryId === 'all') return products;
  
  return products.filter(product => 
    product.categoria === categoryId ||
    product.categoria.includes(categoryId) ||
    product.subcategoria === categoryId
  );
}

// ✅ GERAR SUGESTÕES INTELIGENTES
function generateSmartSuggestions(products: Product[], query: string = ''): string[] {
  if (!query.trim()) {
    return [
      'Coca Cola', 'Arroz', 'Feijão', 'Leite', 'Pão', 
      'Café', 'Óleo', 'Açúcar', 'Detergente', 'Shampoo'
    ];
  }

  const searchTerm = query.toLowerCase();
  const suggestions: string[] = [];

  // Buscar produtos que começam com o termo
  products.forEach(product => {
    if (product.nome.toLowerCase().startsWith(searchTerm)) {
      suggestions.push(product.nome);
    }
  });

  // Buscar categorias relacionadas
  const categories = [...new Set(products.map(p => p.categoria))];
  categories.forEach(cat => {
    if (cat.toLowerCase().includes(searchTerm)) {
      suggestions.push(cat.charAt(0).toUpperCase() + cat.slice(1));
    }
  });

  return [...new Set(suggestions)].slice(0, 8);
}

// ✅ HOOK PRINCIPAL
export function useMultiSourceData(): UseMultiSourceDataReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lastQuery, setLastQuery] = useState<MultiSourceResult | null>(null);

  const cacheRef = useRef<{
    products: Product[];
    timestamp: number;
  } | null>(null);

  // ✅ BUSCA MULTI-SOURCE PRINCIPAL
  const searchMultiSource = useCallback(async (query: string, markets?: string[]): Promise<Product[]> => {
    console.log(`🚀 Multi-source search iniciada: "${query}"${markets ? ` nos mercados: ${markets.join(', ')}` : ''}`);
    
    setLoading(true);
    setError(null);

    try {
      const result = await searchProductsMultiSource(query, markets);
      setLastQuery(result);

      if (result.allProducts.length > 0) {
        const { products: processedProducts, categories: cats, markets: mkts, brands: brds } = 
          processMultiSourceData(result);

        setProducts(processedProducts);
        setAllProducts(processedProducts);
        setCategories(cats);
        setMarkets(mkts);
        setBrands(brds);

        console.log(`✅ Multi-source search concluída:`, {
          produtos: processedProducts.length,
          mercados: result.successfulSources,
          tempo: `${result.queryTime}ms`
        });

        return processedProducts;
      } else {
        console.warn('⚠️ Nenhum produto encontrado na busca multi-source');
        setProducts([]);
        return [];
      }

    } catch (err) {
      console.error('❌ Erro na busca multi-source:', err);
      setError(err instanceof Error ? err.message : 'Erro na busca multi-source');
      setProducts([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ CARREGAMENTO DE MERCADO ESPECÍFICO
  const loadMarketProducts = useCallback(async (marketId: string, query?: string): Promise<Product[]> => {
    console.log(`🏪 Carregando produtos do mercado: ${marketId}${query ? ` com query: "${query}"` : ''}`);
    
    setLoading(true);
    setError(null);

    try {
      const result = await multiSourceAPI.queryMarket(marketId, query);
      
      if (result && result.products.length > 0) {
        setProducts(result.products);
        
        console.log(`✅ Produtos do ${marketId} carregados: ${result.products.length} itens`);
        return result.products;
      } else {
        console.warn(`⚠️ Nenhum produto encontrado no mercado: ${marketId}`);
        setProducts([]);
        return [];
      }

    } catch (err) {
      console.error(`❌ Erro ao carregar produtos do ${marketId}:`, err);
      setError(`Erro ao carregar produtos do ${marketId}`);
      setProducts([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ COMPATIBILIDADE - BUSCA PRODUTOS (LEGACY)
  const searchProducts = useCallback(async (query: string): Promise<Product[]> => {
    return await searchMultiSource(query);
  }, [searchMultiSource]);

  // ✅ COMPATIBILIDADE - CARREGAR POR CATEGORIA (LEGACY)
  const loadProductsByCategory = useCallback(async (categoryId: string): Promise<Product[]> => {
    console.log(`📂 Carregando categoria: ${categoryId}`);
    
    if (!allProducts || allProducts.length === 0) {
      console.warn('⚠️ allProducts vazio, carregando dados primeiro...');
      await searchMultiSource('');
    }

    const filteredProducts = searchByCategory(allProducts, categoryId);
    setProducts(filteredProducts);
    
    console.log(`📂 Categoria "${categoryId}": ${filteredProducts.length} produtos`);
    return filteredProducts;
  }, [allProducts, searchMultiSource]);

  // ✅ COMPATIBILIDADE - CARREGAMENTO INICIAL (LEGACY)
  const loadProducts = useCallback(async (): Promise<void> => {
    console.log('🚀 Carregamento inicial multi-source...');
    
    // Carregar dados usando apenas o endpoint 'default' que funciona
    await searchMultiSource('', ['default']);
  }, [searchMultiSource]);

  // ✅ RECARREGAR DADOS
  const reloadData = useCallback(async (): Promise<void> => {
    console.log('🔄 Recarregando dados multi-source...');
    cacheRef.current = null;
    multiSourceAPI.clearCache();
    await loadProducts();
  }, [loadProducts]);

  // ✅ LIMPAR CACHE MULTI-SOURCE
  const clearMultiSourceCache = useCallback((marketId?: string): void => {
    multiSourceAPI.clearCache(marketId);
    console.log(`🗑️ Cache multi-source limpo${marketId ? ` para ${marketId}` : ''}`);
  }, []);

  // ✅ COMPATIBILIDADE - LIMPAR CACHE (LEGACY)
  const clearCache = useCallback((): void => {
    cacheRef.current = null;
    clearMultiSourceCache();
  }, [clearMultiSourceCache]);

  // ✅ ESTATÍSTICAS MULTI-SOURCE
  const getMultiSourceStats = useCallback(() => {
    return multiSourceAPI.getStats();
  }, []);

  // ✅ SUGESTÕES INTELIGENTES
  const getSmartSuggestions = useCallback((query: string = ''): string[] => {
    return generateSmartSuggestions(allProducts, query);
  }, [allProducts]);

  // ✅ CARREGAMENTO INICIAL AUTOMÁTICO
  useEffect(() => {
    console.log('🎬 useMultiSourceData - Montando hook...');
    // Força usar o endpoint 'default' que sabemos que funciona
    searchMultiSource('', ['default']);
  }, [searchMultiSource]);

  // ✅ LOGS DE DEBUG
  useEffect(() => {
    console.log('📈 useMultiSourceData - Estado atualizado:', {
      products: products.length,
      allProducts: allProducts.length,
      categories: categories.length,
      markets: markets.length,
      brands: brands.length,
      loading,
      error,
      lastQueryTime: lastQuery?.queryTime,
      successfulSources: lastQuery?.successfulSources
    });
  }, [products, allProducts, categories, markets, brands, loading, error, lastQuery]);

  return {
    products,
    allProducts,
    categories,
    markets,
    brands,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    
    // Multi-source specific
    lastQuery,
    searchMultiSource,
    loadMarketProducts,
    clearMultiSourceCache,
    getMultiSourceStats,
    
    // Legacy compatibility
    searchProducts,
    loadProductsByCategory,
    loadProducts,
    reloadData,
    clearCache,
    getSmartSuggestions
  };
}

export default useMultiSourceData;