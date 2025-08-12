// utils/helpers.ts - Funções utilitárias para o Precinho v3

/**
 * Formata um valor monetário para o formato brasileiro
 */
export const formatPrice = (price: number | undefined | null): string => {
  if (typeof price !== 'number' || isNaN(price)) {
    return 'R$ 0,00';
  }
  
  return `R$ ${price.toFixed(2).replace('.', ',')}`;
};

/**
 * Calcula a economia entre dois preços
 */
export const calculateSavings = (originalPrice: number, currentPrice: number): number => {
  if (typeof originalPrice !== 'number' || typeof currentPrice !== 'number') {
    return 0;
  }
  
  return Math.max(0, originalPrice - currentPrice);
};

/**
 * Calcula o percentual de desconto
 */
export const calculateDiscountPercentage = (originalPrice: number, currentPrice: number): number => {
  if (typeof originalPrice !== 'number' || typeof currentPrice !== 'number' || originalPrice <= 0) {
    return 0;
  }
  
  const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
  return Math.round(discount);
};

/**
 * Valida se um produto tem promoção válida
 */
export const hasValidPromotion = (promocao: any): boolean => {
  if (!promocao) return false;
  
  return (
    typeof promocao.desconto === 'number' &&
    typeof promocao.precoOriginal === 'number' &&
    promocao.desconto > 0 &&
    promocao.precoOriginal > 0
  );
};

/**
 * Formata a distância para exibição
 */
export const formatDistance = (distance: number | undefined): string => {
  if (typeof distance !== 'number' || isNaN(distance)) {
    return 'Distância não informada';
  }
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  
  return `${distance.toFixed(1)}km`;
};

/**
 * Trunca texto com reticências
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Gera URL de placeholder para imagens
 */
export const getPlaceholderImage = (width: number = 300, height: number = 300, text?: string): string => {
  const displayText = text || 'Produto';
  return `https://via.placeholder.com/${width}x${height}/f0f0f0/666666?text=${encodeURIComponent(displayText)}`;
};

/**
 * Valida se uma avaliação é válida
 */
export const isValidRating = (rating: any): boolean => {
  return typeof rating === 'number' && rating >= 0 && rating <= 5;
};

/**
 * Formata número de avaliações
 */
export const formatReviewCount = (count: number | undefined): string => {
  if (typeof count !== 'number' || count <= 0) {
    return '';
  }
  
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  
  return count.toString();
};

/**
 * Determina se um produto está disponível
 */
export const isProductAvailable = (product: any): boolean => {
  if (!product) return false;
  
  // Se disponivel está explicitamente definido, use-o
  if (typeof product.disponivel === 'boolean') {
    return product.disponivel;
  }
  
  // Caso contrário, considere disponível se tem preço válido
  return typeof product.preco === 'number' && product.preco > 0;
};

/**
 * Gera um ID único para elementos
 */
export const generateId = (prefix: string = 'item'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Debounce para otimizar buscas
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Sanitiza dados de produto para garantir tipos corretos
 */
export const sanitizeProduct = (rawProduct: any): any => {
  if (!rawProduct || typeof rawProduct !== 'object') {
    return null;
  }
  
  return {
    id: rawProduct.id || generateId('product'),
    nome: typeof rawProduct.nome === 'string' ? rawProduct.nome : 'Produto sem nome',
    preco: typeof rawProduct.preco === 'number' ? rawProduct.preco : 0,
    categoria: typeof rawProduct.categoria === 'string' ? rawProduct.categoria : 'Outros',
    imagem: typeof rawProduct.imagem === 'string' ? rawProduct.imagem : getPlaceholderImage(),
    lojaId: rawProduct.lojaId || generateId('loja'),
    loja: typeof rawProduct.loja === 'string' ? rawProduct.loja : 'Loja não informada',
    descricao: typeof rawProduct.descricao === 'string' ? rawProduct.descricao : '',
    distancia: typeof rawProduct.distancia === 'number' ? rawProduct.distancia : 0,
    promocao: hasValidPromotion(rawProduct.promocao) ? rawProduct.promocao : undefined,
    avaliacao: isValidRating(rawProduct.avaliacao) ? rawProduct.avaliacao : undefined,
    numeroAvaliacoes: typeof rawProduct.numeroAvaliacoes === 'number' ? rawProduct.numeroAvaliacoes : undefined,
    disponivel: isProductAvailable(rawProduct),
    tempoEntrega: typeof rawProduct.tempoEntrega === 'string' ? rawProduct.tempoEntrega : undefined,
    isNovo: Boolean(rawProduct.isNovo),
    isMelhorPreco: Boolean(rawProduct.isMelhorPreco)
  };
};

/**
 * Ordena produtos por diferentes critérios
 */
export const sortProducts = (products: any[], sortBy: string): any[] => {
  if (!Array.isArray(products)) {
    return [];
  }
  
  const validProducts = products.filter(p => p && typeof p === 'object');
  
  switch (sortBy) {
    case 'price-low':
      return validProducts.sort((a, b) => (a.preco || 0) - (b.preco || 0));
    
    case 'price-high':
      return validProducts.sort((a, b) => (b.preco || 0) - (a.preco || 0));
    
    case 'rating':
      return validProducts.sort((a, b) => (b.avaliacao || 0) - (a.avaliacao || 0));
    
    case 'distance':
      return validProducts.sort((a, b) => (a.distancia || 999) - (b.distancia || 999));
    
    case 'name':
      return validProducts.sort((a, b) => 
        (a.nome || '').localeCompare(b.nome || '', 'pt-BR')
      );
    
    default:
      return validProducts;
  }
};

/**
 * Filtra produtos por categoria
 */
export const filterByCategory = (products: any[], category: string): any[] => {
  if (!Array.isArray(products) || !category) {
    return products || [];
  }
  
  return products.filter(product => 
    product && 
    typeof product.categoria === 'string' && 
    product.categoria.toLowerCase().includes(category.toLowerCase())
  );
};

/**
 * Busca produtos por termo
 */
export const searchProducts = (products: any[], searchTerm: string): any[] => {
  if (!Array.isArray(products) || !searchTerm || typeof searchTerm !== 'string') {
    return products || [];
  }
  
  const term = searchTerm.toLowerCase().trim();
  
  return products.filter(product => {
    if (!product || typeof product !== 'object') return false;
    
    const searchableFields = [
      product.nome,
      product.categoria,
      product.loja,
      product.descricao
    ];
    
    return searchableFields.some(field => 
      typeof field === 'string' && 
      field.toLowerCase().includes(term)
    );
  });
};

/**
 * Agrupa produtos por loja
 */
export const groupProductsByStore = (products: any[]): Record<string, any[]> => {
  if (!Array.isArray(products)) {
    return {};
  }
  
  return products.reduce((groups, product) => {
    if (!product || typeof product !== 'object') return groups;
    
    const storeId = product.lojaId || 'sem-loja';
    
    if (!groups[storeId]) {
      groups[storeId] = [];
    }
    
    groups[storeId].push(product);
    return groups;
  }, {} as Record<string, any[]>);
};

/**
 * Calcula estatísticas dos produtos
 */
export const calculateProductStats = (products: any[]) => {
  if (!Array.isArray(products) || products.length === 0) {
    return {
      total: 0,
      available: 0,
      withPromotions: 0,
      averagePrice: 0,
      averageRating: 0,
      totalStores: 0
    };
  }
  
  const validProducts = products.filter(p => p && typeof p === 'object');
  const available = validProducts.filter(p => isProductAvailable(p));
  const withPromotions = validProducts.filter(p => hasValidPromotion(p.promocao));
  const withRatings = validProducts.filter(p => isValidRating(p.avaliacao));
  const stores = new Set(validProducts.map(p => p.lojaId).filter(Boolean));
  
  const totalPrice = validProducts.reduce((sum, p) => sum + (p.preco || 0), 0);
  const totalRating = withRatings.reduce((sum, p) => sum + (p.avaliacao || 0), 0);
  
  return {
    total: validProducts.length,
    available: available.length,
    withPromotions: withPromotions.length,
    averagePrice: validProducts.length > 0 ? totalPrice / validProducts.length : 0,
    averageRating: withRatings.length > 0 ? totalRating / withRatings.length : 0,
    totalStores: stores.size
  };
};