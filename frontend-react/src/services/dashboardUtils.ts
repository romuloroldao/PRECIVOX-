// src/services/dashboardUtils.ts - Utilitários para Dashboard sem dependências problemáticas

// ===== INTERFACES LOCAIS =====
// Definindo interfaces aqui para evitar problemas de importação

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  store: string;
  rating?: number;
  reviews?: number;
  imageUrl?: string;
  category?: string;
  discount?: number;
  inStock?: boolean;
  description?: string;
  brand?: string;
  url?: string;
  lastUpdated?: string;
}

export interface ProductSearchResult extends Product {
  relevanceScore?: number;
  searchRank?: number;
}

export interface DashboardStats {
  totalProducts: number;
  totalStores: number;
  averagePrice: number;
  totalSavings: number;
  categoriesCount: number;
  lastUpdateTime: string;
  activeAlerts: number;
  wishlistItems: number;
  recentSearches: number;
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
  store: string;
  product: string;
}

export interface CategoryData {
  category: string;
  productCount: number;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  topStores: string[];
  trending: boolean;
  growthPercentage?: number;
}

export interface StoreData {
  name: string;
  productCount: number;
  marketShare: number;
  averagePrice: number;
  averageRating: number;
  totalSavings: number;
}

export interface TrendData {
  period: string;
  searches: number;
  sales: number;
  avgPrice: number;
  topCategory: string;
}

// ===== DADOS MOCK =====
export const mockDashboardStats: DashboardStats = {
  totalProducts: 15847,
  totalStores: 25,
  averagePrice: 299.99,
  totalSavings: 28475.50,
  categoriesCount: 12,
  lastUpdateTime: new Date().toISOString(),
  activeAlerts: 8,
  wishlistItems: 15,
  recentSearches: 342
};

export const mockPriceHistory: PriceHistoryPoint[] = [
  { date: '2025-01-01', price: 250.00, store: 'Amazon', product: 'iPhone 15' },
  { date: '2025-01-02', price: 245.50, store: 'Magazine Luiza', product: 'iPhone 15' },
  { date: '2025-01-03', price: 240.00, store: 'Mercado Livre', product: 'iPhone 15' },
  { date: '2025-01-04', price: 235.00, store: 'Amazon', product: 'iPhone 15' },
  { date: '2025-01-05', price: 230.00, store: 'Casas Bahia', product: 'iPhone 15' },
  { date: '2025-01-06', price: 225.00, store: 'Magazine Luiza', product: 'iPhone 15' },
  { date: '2025-01-07', price: 220.00, store: 'Amazon', product: 'iPhone 15' },
  { date: '2025-01-08', price: 215.00, store: 'Fast Shop', product: 'iPhone 15' },
  { date: '2025-01-09', price: 210.00, store: 'Mercado Livre', product: 'iPhone 15' }
];

export const mockCategoryData: CategoryData[] = [
  {
    category: 'Eletrônicos',
    productCount: 5432,
    averagePrice: 899.99,
    priceRange: { min: 49.99, max: 8999.99 },
    topStores: ['Amazon', 'Magazine Luiza', 'Casas Bahia'],
    trending: true,
    growthPercentage: 15.3
  },
  {
    category: 'Casa e Jardim',
    productCount: 3241,
    averagePrice: 199.99,
    priceRange: { min: 19.99, max: 1999.99 },
    topStores: ['Leroy Merlin', 'Telhanorte', 'C&C'],
    trending: false,
    growthPercentage: -2.1
  },
  {
    category: 'Moda',
    productCount: 7891,
    averagePrice: 129.99,
    priceRange: { min: 29.99, max: 899.99 },
    topStores: ['Zara', 'C&A', 'Renner'],
    trending: true,
    growthPercentage: 8.7
  },
  {
    category: 'Informática',
    productCount: 2156,
    averagePrice: 1299.99,
    priceRange: { min: 199.99, max: 8999.99 },
    topStores: ['Amazon', 'Kabum', 'Pichau'],
    trending: true,
    growthPercentage: 12.4
  },
  {
    category: 'Esportes',
    productCount: 1834,
    averagePrice: 179.99,
    priceRange: { min: 39.99, max: 1299.99 },
    topStores: ['Netshoes', 'Centauro', 'Decathlon'],
    trending: false,
    growthPercentage: 3.2
  }
];

export const mockStoreData: StoreData[] = [
  {
    name: 'Amazon',
    productCount: 4200,
    marketShare: 28.5,
    averagePrice: 324.99,
    averageRating: 4.2,
    totalSavings: 8450.00
  },
  {
    name: 'Magazine Luiza',
    productCount: 3800,
    marketShare: 25.1,
    averagePrice: 289.99,
    averageRating: 4.0,
    totalSavings: 7230.00
  },
  {
    name: 'Mercado Livre',
    productCount: 3200,
    marketShare: 21.3,
    averagePrice: 267.50,
    averageRating: 3.9,
    totalSavings: 5680.00
  },
  {
    name: 'Casas Bahia',
    productCount: 2100,
    marketShare: 14.2,
    averagePrice: 312.00,
    averageRating: 3.8,
    totalSavings: 4120.00
  },
  {
    name: 'Fast Shop',
    productCount: 1650,
    marketShare: 10.9,
    averagePrice: 445.00,
    averageRating: 4.1,
    totalSavings: 2995.50
  }
];

export const mockTrendData: TrendData[] = [
  { period: 'Jan 2025', searches: 15420, sales: 3240, avgPrice: 289.99, topCategory: 'Eletrônicos' },
  { period: 'Fev 2025', searches: 18930, sales: 4120, avgPrice: 267.50, topCategory: 'Eletrônicos' },
  { period: 'Mar 2025', searches: 22150, sales: 5340, avgPrice: 245.00, topCategory: 'Casa e Jardim' },
  { period: 'Abr 2025', searches: 28450, sales: 6890, avgPrice: 234.99, topCategory: 'Moda' },
  { period: 'Mai 2025', searches: 32180, sales: 8120, avgPrice: 256.80, topCategory: 'Eletrônicos' },
  { period: 'Jun 2025', searches: 35670, sales: 9240, avgPrice: 278.90, topCategory: 'Informática' }
];

// ===== FUNÇÕES UTILITÁRIAS =====

/**
 * Formata um valor monetário para o padrão brasileiro
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Formata um número com separadores de milhares
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

/**
 * Formata uma data para o padrão brasileiro
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dateObj);
};

/**
 * Formata data e hora completa
 */
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

/**
 * Calcula a porcentagem de desconto
 */
export const calculateDiscountPercentage = (originalPrice: number, currentPrice: number): number => {
  if (originalPrice <= 0 || currentPrice <= 0) return 0;
  if (currentPrice >= originalPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};

/**
 * Calcula a economia em valor absoluto
 */
export const calculateSavings = (originalPrice: number, currentPrice: number): number => {
  if (originalPrice <= 0 || currentPrice <= 0) return 0;
  if (currentPrice >= originalPrice) return 0;
  return originalPrice - currentPrice;
};

/**
 * Gera uma cor aleatória para gráficos
 */
export const generateRandomColor = (): string => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Calcula a média de um array de números
 */
export const calculateAverage = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
};

/**
 * Encontra o valor máximo em um array
 */
export const findMaxValue = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  return Math.max(...numbers);
};

/**
 * Encontra o valor mínimo em um array
 */
export const findMinValue = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  return Math.min(...numbers);
};

/**
 * Calcula a diferença percentual entre dois valores
 */
export const calculatePercentageChange = (oldValue: number, newValue: number): number => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

/**
 * Formata a diferença percentual com símbolo
 */
export const formatPercentageChange = (oldValue: number, newValue: number): string => {
  const change = calculatePercentageChange(oldValue, newValue);
  const symbol = change > 0 ? '+' : '';
  return `${symbol}${change.toFixed(1)}%`;
};

/**
 * Ordena um array de produtos por preço
 */
export const sortProductsByPrice = (products: Product[], ascending: boolean = true): Product[] => {
  return [...products].sort((a, b) => {
    return ascending ? a.price - b.price : b.price - a.price;
  });
};

/**
 * Filtra produtos por categoria
 */
export const filterProductsByCategory = (products: Product[], category: string): Product[] => {
  if (category === 'Todos' || !category) return products;
  return products.filter(product => product.category === category);
};

/**
 * Filtra produtos por faixa de preço
 */
export const filterProductsByPriceRange = (
  products: Product[], 
  minPrice: number, 
  maxPrice: number
): Product[] => {
  return products.filter(product => 
    product.price >= minPrice && product.price <= maxPrice
  );
};

/**
 * Busca produtos por nome
 */
export const searchProductsByName = (products: Product[], searchTerm: string): Product[] => {
  if (!searchTerm.trim()) return products;
  const term = searchTerm.toLowerCase();
  return products.filter(product => 
    product.name.toLowerCase().includes(term) ||
    product.brand?.toLowerCase().includes(term) ||
    product.description?.toLowerCase().includes(term)
  );
};

/**
 * Gera dados de exemplo para gráficos
 */
export const generateChartData = (days: number = 30): PriceHistoryPoint[] => {
  const data: PriceHistoryPoint[] = [];
  const basePrice = 200;
  const stores = ['Amazon', 'Magazine Luiza', 'Mercado Livre', 'Casas Bahia'];
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: basePrice + (Math.random() - 0.5) * 100,
      store: stores[Math.floor(Math.random() * stores.length)],
      product: 'Produto Exemplo'
    });
  }
  
  return data;
};

/**
 * Calcula estatísticas resumidas de uma lista de produtos
 */
export const calculateProductStats = (products: Product[]): {
  total: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  totalSavings: number;
} => {
  if (products.length === 0) {
    return {
      total: 0,
      averagePrice: 0,
      minPrice: 0,
      maxPrice: 0,
      totalSavings: 0
    };
  }

  const prices = products.map(p => p.price);
  const savings = products.map(p => calculateSavings(p.originalPrice || p.price, p.price));

  return {
    total: products.length,
    averagePrice: calculateAverage(prices),
    minPrice: findMinValue(prices),
    maxPrice: findMaxValue(prices),
    totalSavings: savings.reduce((acc, saving) => acc + saving, 0)
  };
};

/**
 * Gera um relatório resumido do dashboard
 */
export const generateDashboardSummary = (): string => {
  const stats = mockDashboardStats;
  return `Dashboard atualizado em ${formatDateTime(stats.lastUpdateTime)}. 
    Total de ${formatNumber(stats.totalProducts)} produtos monitorados em ${stats.totalStores} lojas. 
    Economia total de ${formatCurrency(stats.totalSavings)} identificada.`;
};

/**
 * Valida se um produto tem dados válidos
 */
export const isValidProduct = (product: Partial<Product>): product is Product => {
  return !!(
    product.id &&
    product.name &&
    typeof product.price === 'number' &&
    product.price > 0 &&
    product.store
  );
};

/**
 * Limpa e normaliza dados de produto
 */
export const normalizeProduct = (product: Partial<Product>): Product | null => {
  if (!isValidProduct(product)) return null;
  
  return {
    ...product,
    name: product.name.trim(),
    store: product.store.trim(),
    category: product.category?.trim() || 'Outros',
    price: Math.round(product.price * 100) / 100, // Arredonda para 2 casas decimais
    originalPrice: product.originalPrice ? Math.round(product.originalPrice * 100) / 100 : undefined,
    rating: product.rating && product.rating >= 0 && product.rating <= 5 ? product.rating : undefined,
    reviews: product.reviews && product.reviews >= 0 ? product.reviews : undefined,
    inStock: product.inStock !== false // Default true se não especificado
  };
};

// ===== EXPORTAÇÃO DEFAULT =====
export default {
  // Dados
  mockDashboardStats,
  mockPriceHistory,
  mockCategoryData,
  mockStoreData,
  mockTrendData,
  
  // Formatação
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  
  // Cálculos
  calculateDiscountPercentage,
  calculateSavings,
  calculateAverage,
  calculatePercentageChange,
  formatPercentageChange,
  calculateProductStats,
  
  // Utilidades
  generateRandomColor,
  findMaxValue,
  findMinValue,
  sortProductsByPrice,
  filterProductsByCategory,
  filterProductsByPriceRange,
  searchProductsByName,
  generateChartData,
  generateDashboardSummary,
  isValidProduct,
  normalizeProduct
};