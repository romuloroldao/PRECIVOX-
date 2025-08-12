// hooks/useProductFilters.ts - VERSÃO OTIMIZADA COM FILTROS FUNCIONAIS
import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useDebounce } from './useDebounce';

// ✅ IMPORTAR TIPOS EXISTENTES
import { Product, SearchFilters } from '../types/index';

// ✅ INTERFACES COMPATÍVEIS COM SISTEMA EXISTENTE
interface FilterStats {
  totalProducts: number;
  filteredProducts: number;
  averagePrice: number;
  priceRange: { min: number; max: number };
  categoriesCount: number;
  storesCount: number;
  brandsCount: number;
  promotionsCount: number;
  newProductsCount: number;
}

// ✅ FILTROS PADRÃO COMPATÍVEIS
const defaultFilters: SearchFilters = {
  priceMin: '',
  priceMax: '',
  onlyPromotions: false,
  onlyInStock: true,
  maxDistance: '',
  mercado: 'all',
  marca: 'all',
  rating: 0,
  category: '',
  hasPromotion: false,
  isNew: false,
  isBestPrice: false,
  minRating: 0,
  maxRating: 5,
  sortBy: 'relevance',
  orderBy: 'asc'
};

// ✅ CORREÇÃO PRINCIPAL: SEM PARÂMETRO PRODUCTS - USA APENAS QUANDO NECESSÁRIO
export const useProductFilters = () => {
  // ✅ USANDO useLocalStorage EXISTENTE
  const [filters, setFilters] = useLocalStorage<SearchFilters>(
    'precivox_product_filters', 
    defaultFilters
  );

  const [quickFilters, setQuickFilters] = useState({
    searchTerm: '',
    activeQuickFilter: null as string | null
  });

  // ✅ DEBOUNCE PARA PERFORMANCE
  const debouncedFilters = useDebounce(filters, 300);
  const debouncedQuickFilters = useDebounce(quickFilters, 150);

  // ✅ FUNÇÃO PARA APLICAR FILTROS EXTERNAMENTE (USADA PELO APP)
  const applyFilters = useCallback((productsToFilter: Product[]) => {
    if (!Array.isArray(productsToFilter)) {
      console.warn('⚠️ applyFilters: productsToFilter não é array');
      return [];
    }

    let filtered = [...productsToFilter];
    const currentFilters = debouncedFilters;
    const currentQuickFilters = debouncedQuickFilters;

    // Filtro de termo de busca (quickFilters)
    if (currentQuickFilters.searchTerm) {
      const searchLower = currentQuickFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.nome?.toLowerCase().includes(searchLower) ||
        product.categoria?.toLowerCase().includes(searchLower) ||
        product.subcategoria?.toLowerCase().includes(searchLower) ||
        product.marca?.toLowerCase().includes(searchLower) ||
        product.loja?.toLowerCase().includes(searchLower) ||
        product.descricao?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro de preço mínimo
    if (filters.priceMin && !isNaN(parseFloat(filters.priceMin))) {
      filtered = filtered.filter(product => product.preco >= parseFloat(filters.priceMin));
    }

    // Filtro de preço máximo
    if (filters.priceMax && !isNaN(parseFloat(filters.priceMax))) {
      filtered = filtered.filter(product => product.preco <= parseFloat(filters.priceMax));
    }

    // Filtro de promoções (compatível com ambas estruturas)
    if (filters.onlyPromotions || filters.hasPromotion) {
      filtered = filtered.filter(product => {
        // Suporta tanto promocao.ativo quanto promocao boolean
        if (product.promocao) {
          return typeof product.promocao === 'object' 
            ? product.promocao.ativo 
            : Boolean(product.promocao);
        }
        return false;
      });
    }

    // Filtro de estoque
    if (filters.onlyInStock) {
      filtered = filtered.filter(product => product.disponivel);
    }

    // Filtro de produtos novos
    if (filters.isNew) {
      filtered = filtered.filter(product => product.isNovo);
    }

    // Filtro de melhor preço
    if (filters.isBestPrice) {
      filtered = filtered.filter(product => product.isMelhorPreco);
    }

    // Filtro de distância máxima
    if (filters.maxDistance && !isNaN(parseFloat(filters.maxDistance))) {
      filtered = filtered.filter(product => 
        !product.distancia || product.distancia <= parseFloat(filters.maxDistance)
      );
    }

    // Filtro de categoria
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(product => product.categoria === filters.category);
    }

    // Filtro de mercado
    if (filters.mercado && filters.mercado !== 'all') {
      filtered = filtered.filter(product => product.loja === filters.mercado);
    }

    // Filtro de marca
    if (filters.marca && filters.marca !== 'all') {
      filtered = filtered.filter(product => product.marca === filters.marca);
    }

    // Filtro de avaliação mínima
    if (filters.rating > 0) {
      filtered = filtered.filter(product => 
        (product.avaliacao || 0) >= filters.rating
      );
    }

    // Filtro de avaliação por range
    if (filters.minRating > 0) {
      filtered = filtered.filter(product => 
        (product.avaliacao || 0) >= filters.minRating
      );
    }

    if (filters.maxRating < 5) {
      filtered = filtered.filter(product => 
        (product.avaliacao || 0) <= filters.maxRating
      );
    }

    // ✅ APLICAR ORDENAÇÃO
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'price_asc':
          comparison = a.preco - b.preco;
          break;
        case 'price_desc':
          comparison = b.preco - a.preco;
          break;
        case 'rating':
          comparison = (b.avaliacao || 0) - (a.avaliacao || 0);
          break;
        case 'distance':
          comparison = (a.distancia || 999) - (b.distancia || 999);
          break;
        case 'name':
          comparison = a.nome.localeCompare(b.nome);
          break;
        case 'newest':
          comparison = (b.isNovo ? 1 : 0) - (a.isNovo ? 1 : 0);
          break;
        case 'discount':
          const aDiscount = typeof a.promocao === 'object' ? a.promocao?.desconto || 0 : 0;
          const bDiscount = typeof b.promocao === 'object' ? b.promocao?.desconto || 0 : 0;
          comparison = bDiscount - aDiscount;
          break;
        case 'popularity':
          comparison = (b.visualizacoes || 0) - (a.visualizacoes || 0);
          break;
        case 'conversion':
          comparison = (b.conversoes || 0) - (a.conversoes || 0);
          break;
        case 'relevance':
        default:
          // Algoritmo de relevância
          let scoreA = 0;
          let scoreB = 0;
          
          if (a.isMelhorPreco) scoreA += 3;
          if (b.isMelhorPreco) scoreB += 3;
          
          if (a.promocao) scoreA += 2;
          if (b.promocao) scoreB += 2;
          
          if (a.isNovo) scoreA += 1;
          if (b.isNovo) scoreB += 1;
          
          scoreA += (a.avaliacao || 0);
          scoreB += (b.avaliacao || 0);
          
          comparison = scoreB - scoreA;
          break;
      }
      
      return filters.orderBy === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [filters, quickFilters]);

  // ✅ ESTATÍSTICAS DOS FILTROS
  const generateFilterStats = useCallback((productsToAnalyze: Product[]): FilterStats => {
    if (!Array.isArray(productsToAnalyze) || productsToAnalyze.length === 0) {
      return {
        totalProducts: 0,
        filteredProducts: 0,
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        categoriesCount: 0,
        storesCount: 0,
        brandsCount: 0,
        promotionsCount: 0,
        newProductsCount: 0
      };
    }

    const filteredProducts = applyFilters(productsToAnalyze);
    const prices = filteredProducts.map(p => p.preco);
    const totalPrice = prices.reduce((sum, price) => sum + price, 0);
    
    const categories = new Set(filteredProducts.map(p => p.categoria));
    const stores = new Set(filteredProducts.map(p => p.loja));
    const brands = new Set(filteredProducts.map(p => p.marca).filter(Boolean));
    
    return {
      totalProducts: productsToAnalyze.length,
      filteredProducts: filteredProducts.length,
      averagePrice: totalPrice / filteredProducts.length || 0,
      priceRange: {
        min: Math.min(...prices) || 0,
        max: Math.max(...prices) || 0
      },
      categoriesCount: categories.size,
      storesCount: stores.size,
      brandsCount: brands.size,
      promotionsCount: filteredProducts.filter(p => p.promocao).length,
      newProductsCount: filteredProducts.filter(p => p.isNovo).length
    };
  }, [applyFilters]);

  // ✅ FUNÇÕES DE CONTROLE
  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, [setFilters]);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setQuickFilters({ searchTerm: '', activeQuickFilter: null });
  }, [setFilters]);

  // ✅ VERIFICAR SE HÁ FILTROS ATIVOS
  const hasActiveFilters = useMemo(() => {
    const hasStandardFilters = (
      filters.priceMin !== defaultFilters.priceMin ||
      filters.priceMax !== defaultFilters.priceMax ||
      filters.onlyPromotions !== defaultFilters.onlyPromotions ||
      filters.onlyInStock !== defaultFilters.onlyInStock ||
      filters.maxDistance !== defaultFilters.maxDistance ||
      filters.mercado !== defaultFilters.mercado ||
      filters.marca !== defaultFilters.marca ||
      filters.rating !== defaultFilters.rating ||
      filters.category !== defaultFilters.category ||
      filters.hasPromotion !== defaultFilters.hasPromotion ||
      filters.isNew !== defaultFilters.isNew ||
      filters.isBestPrice !== defaultFilters.isBestPrice ||
      filters.sortBy !== defaultFilters.sortBy ||
      filters.orderBy !== defaultFilters.orderBy
    );
    
    const hasQuickFilters = quickFilters.searchTerm !== '' || quickFilters.activeQuickFilter !== null;
    
    return hasStandardFilters || hasQuickFilters;
  }, [filters, quickFilters]);

  // ✅ FUNÇÕES DE LIMPEZA ESPECÍFICAS
  const clearPriceFilters = useCallback(() => {
    updateFilter('priceMin', '');
    updateFilter('priceMax', '');
  }, [updateFilter]);

  const clearLocationFilters = useCallback(() => {
    updateFilter('maxDistance', '');
    updateFilter('mercado', 'all');
  }, [updateFilter]);

  const clearProductFilters = useCallback(() => {
    updateFilter('marca', 'all');
    updateFilter('category', '');
    updateFilter('rating', 0);
  }, [updateFilter]);

  const clearBooleanFilters = useCallback(() => {
    updateFilter('onlyPromotions', false);
    updateFilter('hasPromotion', false);
    updateFilter('isNew', false);
    updateFilter('isBestPrice', false);
    updateFilter('onlyInStock', true);
  }, [updateFilter]);

  const applyQuickFilter = useCallback((filterType: string) => {
    switch (filterType) {
      case 'promotions':
        updateFilter('onlyPromotions', !filters.onlyPromotions);
        break;
      case 'new':
        updateFilter('isNew', !filters.isNew);
        break;
      case 'best-price':
        updateFilter('isBestPrice', !filters.isBestPrice);
        break;
      case 'in-stock':
        updateFilter('onlyInStock', !filters.onlyInStock);
        break;
      case 'high-rated':
        updateFilter('rating', filters.rating === 4 ? 0 : 4);
        break;
    }
    
    setQuickFilters(prev => ({
      ...prev,
      activeQuickFilter: prev.activeQuickFilter === filterType ? null : filterType
    }));
  }, [filters, updateFilter]);

  const setSearchTerm = useCallback((term: string) => {
    setQuickFilters(prev => ({ ...prev, searchTerm: term }));
  }, []);

  // ✅ OBTER OPÇÕES ÚNICAS PARA DROPDOWNS
  const getUniqueOptions = useCallback((products: Product[]) => {
    if (!Array.isArray(products)) return { categories: [], subcategories: [], stores: [], brands: [] };
    
    const categories = [...new Set(products.map(p => p.categoria))];
    const subcategories = [...new Set(products.map(p => p.subcategoria).filter(Boolean))];
    const stores = [...new Set(products.map(p => p.loja))];
    const brands = [...new Set(products.map(p => p.marca).filter(Boolean))];
    
    return {
      categories: categories.map(cat => ({ value: cat, label: cat })),
      subcategories: subcategories.map(sub => ({ value: sub!, label: sub! })),
      stores: stores.map(store => ({ value: store, label: store })),
      brands: brands.map(brand => ({ value: brand!, label: brand! }))
    };
  }, []);

  return {
    // Estado atual
    filters,
    quickFilters,
    
    // Funções de controle principais
    updateFilter,
    clearFilters,
    setFilters,
    applyQuickFilter,
    setSearchTerm,
    applyFilters, // ✅ FUNÇÃO PRINCIPAL USADA PELO APP
    
    // ✅ FUNÇÕES DE LIMPEZA ESPECÍFICAS
    clearPriceFilters,
    clearLocationFilters,
    clearProductFilters,
    clearBooleanFilters,
    
    // Funções utilitárias
    generateFilterStats,
    getUniqueOptions,
    
    // ✅ ESTADOS ÚTEIS MELHORADOS
    hasActiveFilters,
    isLoading: false,
    filterCount: Object.values(filters).filter(v => v !== '' && v !== 'all' && v !== false && v !== 0).length + (quickFilters.searchTerm ? 1 : 0),
    
    // ✅ ESTATÍSTICAS DE FILTROS ATIVOS
    activeFiltersInfo: {
      search: quickFilters.searchTerm !== '',
      price: filters.priceMin !== '' || filters.priceMax !== '',
      category: filters.category !== '' && filters.category !== 'all',
      promotions: filters.onlyPromotions || filters.hasPromotion,
      availability: !filters.onlyInStock,
      location: filters.maxDistance !== '' || filters.mercado !== 'all',
      brand: filters.marca !== 'all',
      quality: filters.rating > 0 || filters.isNew || filters.isBestPrice,
      sorting: filters.sortBy !== 'relevance' || filters.orderBy !== 'asc'
    }
  };
};