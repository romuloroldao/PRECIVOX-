// services/filterService.ts - SERVIÇO CENTRALIZADO DE FILTROS
import { Product } from '../types/product';

export interface FilterState {
  // Busca
  searchQuery: string;
  category: string;
  
  // Preço
  priceMin: string;
  priceMax: string;
  
  // Localização
  maxDistance: string;
  mercado: string;
  
  // Produto
  marca: string;
  rating: number;
  onlyPromotions: boolean;
  onlyInStock: boolean;
  hasPromotion: boolean;
  isNew: boolean;
  isBestPrice: boolean;
  
  // Ordenação
  sortBy: string;
  orderBy: 'asc' | 'desc';
  
  // Avaliação
  minRating: number;
  maxRating: number;
}

export const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  category: 'all',
  priceMin: '',
  priceMax: '',
  maxDistance: '',
  mercado: 'all',
  marca: 'all',
  rating: 0,
  onlyPromotions: false,
  onlyInStock: true,
  hasPromotion: false,
  isNew: false,
  isBestPrice: false,
  sortBy: 'relevance',
  orderBy: 'asc',
  minRating: 0,
  maxRating: 5
};

export class FilterService {
  /**
   * Aplicar todos os filtros em uma lista de produtos
   */
  static applyFilters(products: Product[], filters: FilterState): Product[] {
    console.log('🔍 FilterService.applyFilters iniciado', {
      inputProducts: products.length,
      activeFilters: this.getActiveFilters(filters)
    });

    let filtered = [...products];

    // 1. Filtro de busca textual
    if (filters.searchQuery?.trim()) {
      const searchTerm = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product => 
        product.nome?.toLowerCase().includes(searchTerm) ||
        product.marca?.toLowerCase().includes(searchTerm) ||
        product.categoria?.toLowerCase().includes(searchTerm) ||
        product.descricao?.toLowerCase().includes(searchTerm)
      );
      console.log(`✅ Filtro de busca "${searchTerm}": ${filtered.length} produtos`);
    }

    // 2. Filtro de categoria
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(product => 
        product.categoria?.toLowerCase() === filters.category.toLowerCase()
      );
      console.log(`✅ Filtro de categoria "${filters.category}": ${filtered.length} produtos`);
    }

    // 3. Filtro de preço mínimo
    if (filters.priceMin && !isNaN(parseFloat(filters.priceMin))) {
      const minPrice = parseFloat(filters.priceMin);
      filtered = filtered.filter(product => (product.preco || 0) >= minPrice);
      console.log(`✅ Filtro preço mínimo R$ ${minPrice}: ${filtered.length} produtos`);
    }

    // 4. Filtro de preço máximo
    if (filters.priceMax && !isNaN(parseFloat(filters.priceMax))) {
      const maxPrice = parseFloat(filters.priceMax);
      filtered = filtered.filter(product => (product.preco || 0) <= maxPrice);
      console.log(`✅ Filtro preço máximo R$ ${maxPrice}: ${filtered.length} produtos`);
    }

    // 5. Filtro de mercado
    if (filters.mercado && filters.mercado !== 'all') {
      filtered = filtered.filter(product => 
        product.mercado?.toLowerCase().includes(filters.mercado.toLowerCase()) ||
        product.loja?.toLowerCase().includes(filters.mercado.toLowerCase())
      );
      console.log(`✅ Filtro mercado "${filters.mercado}": ${filtered.length} produtos`);
    }

    // 6. Filtro de marca
    if (filters.marca && filters.marca !== 'all') {
      filtered = filtered.filter(product => 
        product.marca?.toLowerCase().includes(filters.marca.toLowerCase())
      );
      console.log(`✅ Filtro marca "${filters.marca}": ${filtered.length} produtos`);
    }

    // 7. Filtro de avaliação mínima
    if (filters.rating > 0) {
      filtered = filtered.filter(product => (product.rating || 0) >= filters.rating);
      console.log(`✅ Filtro rating >= ${filters.rating}: ${filtered.length} produtos`);
    }

    // 8. Filtro de distância máxima
    if (filters.maxDistance && !isNaN(parseFloat(filters.maxDistance))) {
      const maxDist = parseFloat(filters.maxDistance);
      filtered = filtered.filter(product => (product.distancia || 0) <= maxDist);
      console.log(`✅ Filtro distância <= ${maxDist}km: ${filtered.length} produtos`);
    }

    // 9. Filtros booleanos
    if (filters.onlyPromotions) {
      filtered = filtered.filter(product => product.promocao === true);
      console.log(`✅ Filtro apenas promoções: ${filtered.length} produtos`);
    }

    if (filters.onlyInStock) {
      filtered = filtered.filter(product => 
        product.disponivel === true || (product.estoque || 0) > 0
      );
      console.log(`✅ Filtro apenas em estoque: ${filtered.length} produtos`);
    }

    if (filters.hasPromotion) {
      filtered = filtered.filter(product => 
        product.promocao === true || (product.desconto || 0) > 0
      );
      console.log(`✅ Filtro com promoção: ${filtered.length} produtos`);
    }

    if (filters.isNew) {
      filtered = filtered.filter(product => product.isNovo === true);
      console.log(`✅ Filtro produtos novos: ${filtered.length} produtos`);
    }

    if (filters.isBestPrice) {
      // Implementar lógica de melhor preço baseada nos dados disponíveis
      filtered = filtered.filter(product => product.melhorPreco === true);
      console.log(`✅ Filtro melhor preço: ${filtered.length} produtos`);
    }

    // 10. Aplicar ordenação
    filtered = this.applySorting(filtered, filters.sortBy, filters.orderBy);

    console.log(`🎯 FilterService.applyFilters concluído: ${filtered.length} produtos finais`);
    return filtered;
  }

  /**
   * Aplicar ordenação aos produtos
   */
  static applySorting(products: Product[], sortBy: string, orderBy: 'asc' | 'desc'): Product[] {
    const sorted = [...products].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'price_asc':
        case 'price_desc':
          comparison = (a.preco || 0) - (b.preco || 0);
          if (sortBy === 'price_desc') comparison = -comparison;
          break;

        case 'distance':
          comparison = (a.distancia || 0) - (b.distancia || 0);
          break;

        case 'rating':
          comparison = (b.rating || 0) - (a.rating || 0);
          break;

        case 'discount':
          comparison = (b.desconto || 0) - (a.desconto || 0);
          break;

        case 'newest':
          comparison = new Date(b.dataAtualizacao || 0).getTime() - new Date(a.dataAtualizacao || 0).getTime();
          break;

        case 'popularity':
          comparison = (b.visualizacoes || 0) - (a.visualizacoes || 0);
          break;

        case 'conversion':
          comparison = (b.vendas || 0) - (a.vendas || 0);
          break;

        case 'alphabetical':
          comparison = a.nome.localeCompare(b.nome);
          break;

        case 'relevance':
        default:
          // Relevância baseada em promoção, disponibilidade e rating
          const aScore = (a.promocao ? 100 : 0) + 
                        (a.disponivel ? 50 : 0) + 
                        ((a.rating || 0) * 10);
          const bScore = (b.promocao ? 100 : 0) + 
                        (b.disponivel ? 50 : 0) + 
                        ((b.rating || 0) * 10);
          comparison = bScore - aScore;
          
          // Fallback para ordem alfabética se scores iguais
          if (comparison === 0) {
            comparison = a.nome.localeCompare(b.nome);
          }
          break;
      }

      // Aplicar ordem crescente/decrescente se especificado
      if (orderBy === 'desc' && sortBy !== 'price_desc') {
        comparison = -comparison;
      }

      return comparison;
    });

    console.log(`✅ Ordenação aplicada: ${sortBy} (${orderBy}) - ${sorted.length} produtos`);
    return sorted;
  }

  /**
   * Verificar se há filtros ativos
   */
  static hasActiveFilters(filters: FilterState): boolean {
    const defaults = DEFAULT_FILTERS;
    
    return (
      filters.searchQuery !== defaults.searchQuery ||
      filters.category !== defaults.category ||
      filters.priceMin !== defaults.priceMin ||
      filters.priceMax !== defaults.priceMax ||
      filters.maxDistance !== defaults.maxDistance ||
      filters.mercado !== defaults.mercado ||
      filters.marca !== defaults.marca ||
      filters.rating !== defaults.rating ||
      filters.onlyPromotions !== defaults.onlyPromotions ||
      filters.onlyInStock !== defaults.onlyInStock ||
      filters.hasPromotion !== defaults.hasPromotion ||
      filters.isNew !== defaults.isNew ||
      filters.isBestPrice !== defaults.isBestPrice ||
      filters.sortBy !== defaults.sortBy ||
      filters.orderBy !== defaults.orderBy
    );
  }

  /**
   * Obter lista de filtros ativos para debug
   */
  static getActiveFilters(filters: FilterState): string[] {
    const active: string[] = [];
    const defaults = DEFAULT_FILTERS;

    if (filters.searchQuery !== defaults.searchQuery) active.push(`busca: "${filters.searchQuery}"`);
    if (filters.category !== defaults.category) active.push(`categoria: ${filters.category}`);
    if (filters.priceMin !== defaults.priceMin) active.push(`preço mín: R$ ${filters.priceMin}`);
    if (filters.priceMax !== defaults.priceMax) active.push(`preço máx: R$ ${filters.priceMax}`);
    if (filters.mercado !== defaults.mercado) active.push(`mercado: ${filters.mercado}`);
    if (filters.marca !== defaults.marca) active.push(`marca: ${filters.marca}`);
    if (filters.rating !== defaults.rating) active.push(`rating: ${filters.rating}★`);
    if (filters.onlyPromotions !== defaults.onlyPromotions) active.push('apenas promoções');
    if (filters.onlyInStock !== defaults.onlyInStock) active.push('apenas disponíveis');
    if (filters.sortBy !== defaults.sortBy) active.push(`ordenar: ${filters.sortBy}`);

    return active;
  }

  /**
   * Limpar todos os filtros
   */
  static clearAllFilters(): FilterState {
    return { ...DEFAULT_FILTERS };
  }

  /**
   * Aplicar filtro rápido por categoria
   */
  static applyQuickCategoryFilter(filters: FilterState, category: string): FilterState {
    return {
      ...filters,
      category: category,
      searchQuery: '' // Limpar busca quando muda categoria
    };
  }

  /**
   * Aplicar filtro rápido por preço
   */
  static applyQuickPriceFilter(filters: FilterState, min?: string, max?: string): FilterState {
    return {
      ...filters,
      priceMin: min || '',
      priceMax: max || ''
    };
  }

  /**
   * Toggle filtro de promoções
   */
  static togglePromotionsFilter(filters: FilterState): FilterState {
    return {
      ...filters,
      onlyPromotions: !filters.onlyPromotions
    };
  }

  /**
   * Obter estatísticas dos filtros aplicados
   */
  static getFilterStats(originalProducts: Product[], filteredProducts: Product[], filters: FilterState) {
    const activeFiltersCount = this.getActiveFilters(filters).length;
    const reductionPercentage = originalProducts.length > 0 
      ? Math.round(((originalProducts.length - filteredProducts.length) / originalProducts.length) * 100)
      : 0;

    return {
      originalCount: originalProducts.length,
      filteredCount: filteredProducts.length,
      activeFiltersCount,
      reductionPercentage,
      hasActiveFilters: this.hasActiveFilters(filters),
      activeFilters: this.getActiveFilters(filters)
    };
  }
}

export default FilterService;