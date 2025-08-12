// hooks/useAutoDiscoveryData.ts - Hook com Sistema de Autodescoberta AUTOMÁTICO + CACHE
import { useState, useEffect, useCallback, useRef } from 'react';
import { autoDiscoveryAPI } from '../services/autoDiscoveryApi';
import { Product } from '../types/product';
import { cacheService } from '../services/cacheService';

interface Category {
  id: string;
  label: string;
  icon?: string;
  count: number;
}

interface UseAutoDiscoveryDataReturn {
  products: Product[];
  allProducts: Product[];
  categories: Category[];
  markets: string[];
  brands: string[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // Funções principais
  searchProducts: (query: string) => Promise<Product[]>;
  loadProducts: () => Promise<void>;
  reloadData: () => Promise<void>;
  clearCache: () => void;
  
  // Estatísticas
  totalSources: number;
  totalMarkets: number;
  lastLoadTime: number;
}

// ✅ ÍCONES POR CATEGORIA
const getCategoryIcon = (categoryId: string): string => {
  const iconMap: Record<string, string> = {
    'bebidas': '🥤',
    'carnes': '🥩',
    'frutas': '🍎',
    'verduras': '🥬',
    'legumes': '🥕',
    'padaria': '🍞',
    'laticínios': '🥛',
    'cereais': '🌾',
    'grãos': '🌾',
    'limpeza': '🧽',
    'higiene': '🧴',
    'congelados': '🧊',
    'doces': '🍬',
    'temperos': '🧂',
    'conservas': '🥫',
    'massas': '🍝',
    'óleos': '🫒',
    'snacks': '🍿'
  };
  
  return iconMap[categoryId.toLowerCase()] || '📦';
};

export const useAutoDiscoveryData = (): UseAutoDiscoveryDataReturn => {
  // ✅ ESTADOS LOCAIS
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ✅ ESTATÍSTICAS
  const [totalSources, setTotalSources] = useState(0);
  const [totalMarkets, setTotalMarkets] = useState(0);
  const [lastLoadTime, setLastLoadTime] = useState(0);
  
  // Refs para controle
  const isInitialized = useRef(false);
  const mountedRef = useRef(true);

  // ✅ PROCESSAR DADOS CARREGADOS
  const processLoadedData = useCallback((result: any) => {
    console.log('🔄 processLoadedData chamado com:', {
      mounted: mountedRef.current,
      resultKeys: Object.keys(result || {}),
      productos: result?.products?.length || 0,
      categories: result?.categories?.length || 0,
      markets: result?.markets?.length || 0
    });

    // Removido a validação de mounted que estava impedindo o processamento
    // if (!mountedRef.current) {
    //   console.log('⚠️ processLoadedData: componente não montado, saindo...');
    //   return;
    // }

    const allProductsData = result.products || [];
    const apiCategories = result.categories || [];
    
    console.log(`📊 Processando ${allProductsData.length} produtos...`);

    // Usar categorias da API se disponíveis, senão extrair dos produtos
    let processedCategories: Category[] = [];
    
    console.log('📂 Processando categorias:', {
      apiCategories: apiCategories.length,
      allProductsData: allProductsData.length,
      amostraApiCategories: apiCategories.slice(0, 3),
      amostraProdutos: allProductsData.slice(0, 3).map(p => ({ nome: p.nome, categoria: p.categoria }))
    });
    
    if (apiCategories.length > 0) {
      processedCategories = apiCategories.map((cat: any) => ({
        id: cat.id || cat.nome,
        label: cat.label || (cat.nome?.charAt(0).toUpperCase() + cat.nome?.slice(1)) || cat.id,
        icon: getCategoryIcon(cat.id || cat.nome),
        count: cat.total_produtos || cat.count || 0
      })).sort((a, b) => b.count - a.count);
      console.log('📂 Usando categorias da API:', processedCategories);
    } else {
      // Fallback: extrair categorias dos produtos
      const uniqueCategories = Array.from(new Set(allProductsData.map(p => p.categoria)));
      console.log('📂 Categorias únicas extraídas dos produtos:', uniqueCategories);
      
      processedCategories = uniqueCategories.map(catId => {
        const productCount = allProductsData.filter(p => p.categoria === catId).length;
        return {
          id: catId,
          label: catId.charAt(0).toUpperCase() + catId.slice(1),
          icon: getCategoryIcon(catId),
          count: productCount
        };
      }).sort((a, b) => b.count - a.count);
      console.log('📂 Categorias processadas dos produtos:', processedCategories);
    }

    // Extrair mercados únicos
    const uniqueMarkets = result.markets || Array.from(new Set(
      allProductsData.map(p => p.loja || p.mercado).filter(Boolean)
    ));

    // Extrair marcas únicas
    const uniqueBrands = Array.from(new Set(
      allProductsData.map(p => p.marca).filter(Boolean)
    ));

    // Atualizar estados
    setAllProducts(allProductsData);
    setProducts(allProductsData); // Inicialmente mostra todos
    setCategories(processedCategories);
    setMarkets(uniqueMarkets);
    setBrands(uniqueBrands);

    console.log(`✅ Dados processados:`);
    console.log(`📦 ${allProductsData.length} produtos`);
    console.log(`📂 ${processedCategories.length} categorias`);
    console.log(`🏪 ${uniqueMarkets.length} mercados`);
    console.log(`🏷️ ${uniqueBrands.length} marcas`);
    console.log('🔍 Primeiros 3 produtos:', allProductsData.slice(0, 3).map(p => p.nome));
    console.log('🗂️ Categorias processadas:', processedCategories.map(c => `${c.label} (${c.count})`));
  }, []);

  // ✅ CARREGAR TODOS OS DADOS (AUTODESCOBERTA)
  const loadProducts = useCallback(async () => {
    if (loading) {
      console.log('🚫 loadProducts: já carregando, aguardando...');
      return;
    }

    setLoading(true);
    setError(null);
    
    console.log('🔍 Iniciando autodescoberta de dados...');
    console.log('🔄 Forçando limpeza de cache...');
    
    // Teste direto de acesso aos arquivos
    try {
      console.log('🧪 Testando acesso direto aos arquivos...');
      const testResponse = await fetch('/atacadao_franco.json', { method: 'HEAD' });
      console.log(`🧪 Teste direto atacadao_franco.json: ${testResponse.status}`);
    } catch (error) {
      console.log('🧪 Erro no teste direto:', error);
    }
    
    try {
      // Força uma recarga completa
      const result = await autoDiscoveryAPI.forceRefresh();
      
      if (result.errors.length > 0) {
        console.warn('⚠️ Avisos durante carregamento:', result.errors);
      }

      setTotalSources(result.sources.length);
      setTotalMarkets(result.markets.length);
      setLastLoadTime(result.loadTime);

      console.log('🔗 Antes de chamar processLoadedData:', {
        resultKeys: Object.keys(result),
        products: result.products?.length || 0,
        categories: result.categories?.length || 0,
        markets: result.markets?.length || 0
      });

      processLoadedData(result);
      
      console.log(`🎉 Autodescoberta concluída em ${result.loadTime}ms`);

    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar dados automaticamente';
      console.error('❌ Erro na autodescoberta:', errorMessage);
      setError(errorMessage);
      
      // Dados de fallback
      setAllProducts([]);
      setProducts([]);
      setCategories([]);
      setMarkets([]);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, [loading, processLoadedData]);

  // ✅ BUSCAR PRODUTOS COM CACHE INTELIGENTE
  const searchProducts = useCallback(async (query: string): Promise<Product[]> => {
    console.log(`🔍 Hook searchProducts chamado com: "${query}" (length: ${query ? query.length : 0})`);
    
    if (!query || query.trim() === '') {
      setProducts([]);
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();
    
    try {
      setLoading(true);
      setError(null);
      
      // ✅ VERIFICAR CACHE INTELIGENTE PRIMEIRO
      const cachedResults = cacheService.getCachedProducts(normalizedQuery);
      
      if (cachedResults && cachedResults.length > 0) {
        console.log(`📦 Cache hit: ${cachedResults.length} produtos`);
        setProducts(cachedResults);
        setSearchTerm(query);
        return cachedResults;
      }

      console.log('🌐 Buscando na API...');
      const results = await autoDiscoveryAPI.searchProducts(query);
      
      // ✅ SALVAR NO CACHE INTELIGENTE
      if (results.length > 0) {
        cacheService.cacheProducts(results, normalizedQuery);
      }
      
      setProducts(results);
      setSearchTerm(query);
      
      console.log(`✅ Hook busca concluída: ${results.length} produtos encontrados`);
      console.log(`📊 Hook primeiros 3 produtos:`, results.slice(0, 3).map(p => p.nome));
      return results;
      
    } catch (err: any) {
      const errorMessage = err.message || 'Erro na busca';
      console.error('❌ Erro na busca:', errorMessage);
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ RECARREGAR DADOS (FORÇA ATUALIZAÇÃO)
  const reloadData = useCallback(async () => {
    console.log('🔄 Forçando recarga de todos os dados...');
    setLoading(true);
    
    try {
      const result = await autoDiscoveryAPI.forceRefresh();
      processLoadedData(result);
      
      setTotalSources(result.sources.length);
      setTotalMarkets(result.markets.length);
      setLastLoadTime(result.loadTime);
      
      console.log('✅ Recarga concluída');
    } catch (err: any) {
      console.error('❌ Erro na recarga:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [processLoadedData]);

  // ✅ LIMPAR CACHE
  const clearCache = useCallback(() => {
    console.log('🗑️ Limpando cache local...');
    setProducts([]);
    setAllProducts([]);
    setCategories([]);
    setMarkets([]);
    setBrands([]);
    setSearchTerm('');
    setError(null);
    // O autoDiscoveryAPI tem seu próprio cache interno
  }, []);

  // ✅ INICIALIZAÇÃO AUTOMÁTICA
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      console.log('🚀 Inicializando sistema de autodescoberta...');
      console.log('📊 Estado inicial:', { 
        products: products.length, 
        allProducts: allProducts.length, 
        categories: categories.length,
        loading 
      });
      
      // Load products immediately without timeout to prevent race conditions
      loadProducts();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [loadProducts]);

  // ✅ BUSCA AUTOMÁTICA QUANDO SEARCH TERM MUDA
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setProducts(allProducts);
    }
  }, [searchTerm, allProducts]);

  // ✅ GARANTIR QUE OS PRODUTOS SEJAM EXIBIDOS INICIALMENTE
  useEffect(() => {
    if (allProducts.length > 0 && products.length === 0 && !searchTerm.trim()) {
      console.log('🔄 Definindo produtos iniciais para exibição:', allProducts.length);
      setProducts(allProducts);
    }
  }, [allProducts, products.length, searchTerm]);

  // ✅ DEBUG: MONITORAR MUDANÇAS DE ESTADO
  useEffect(() => {
    console.log('📊 useAutoDiscoveryData - Estado atualizado:', {
      allProducts: allProducts.length,
      products: products.length,
      categories: categories.length,
      loading,
      error: error || 'null',
      searchTerm: searchTerm || 'vazio'
    });
  }, [allProducts.length, products.length, categories.length, loading, error, searchTerm]);

  return {
    // Estados principais
    products,
    allProducts,
    categories,
    markets,
    brands,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    
    // Funções
    searchProducts,
    loadProducts,
    reloadData,
    clearCache,
    
    // Estatísticas
    totalSources,
    totalMarkets,
    lastLoadTime
  };
};