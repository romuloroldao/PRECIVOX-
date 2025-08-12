// src/types/product.ts - Tipos unificados para o sistema multi-source
export interface Product {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  subcategoria?: string;
  imagem?: string;
  loja: string;
  lojaId?: string;
  descricao?: string;
  distancia?: number;
  promocao?: {
    ativo?: boolean;
    desconto: number;
    precoOriginal: number;
    validoAte?: string;
  } | boolean;
  avaliacao?: number;
  numeroAvaliacoes?: number;
  disponivel: boolean;
  tempoEntrega?: string;
  isNovo?: boolean;
  isMelhorPreco?: boolean;
  marca?: string;
  codigo?: string;
  peso?: string;
  origem?: string;
  visualizacoes?: number;
  conversoes?: number;
  estoque?: number;
  endereco?: string;
  telefone?: string;
  tags?: string[];
}

export interface Category {
  id: string;
  label: string;
  icon?: string;
  count?: number;
  color?: string;
  description?: string;
}

// ✅ TIPOS PARA SISTEMA MULTI-SOURCE
export interface MarketDataSource {
  id: string;
  name: string;
  apiUrl: string;
  type: 'api' | 'json' | 'csv' | 'xml';
  enabled: boolean;
  priority: number; // 1 = alta, 2 = média, 3 = baixa
  timeout: number; // em milissegundos
  headers?: Record<string, string>;
  transformFunction?: string; // nome da função de transformação
  lastSync?: string;
  cacheTTL?: number; // tempo de vida do cache em minutos
}

export interface QueryResult {
  products: Product[];
  source: MarketDataSource;
  timestamp: number;
  fromCache: boolean;
  errors?: string[];
}

export interface MultiSourceResult {
  allProducts: Product[];
  resultsByMarket: Record<string, QueryResult>;
  totalSources: number;
  successfulSources: number;
  errors: string[];
  queryTime: number;
}

export interface DataAdapterConfig {
  useMultiSource?: boolean;
  fallbackToLocal?: boolean;
  preferredMarkets?: string[];
  enableCache?: boolean;
}

export type DataSourceType = 'multi-source' | 'local' | 'hybrid' | 'none';

// ✅ TIPOS DE LISTA EM PORTUGUÊS (COMPATÍVEL COM O SISTEMA EXISTENTE)
export interface ListaItem {
  produto: Product;
  quantidade: number;
}

export interface Lista {
  id: string;
  nome: string;
  itens: ListaItem[];
  dataUltimaEdicao: string;
  dataCriacao: string;
  descricao?: string;
  categoria?: string;
  status?: 'ativa' | 'concluida' | 'arquivada';
}

// ✅ INTERFACE PARA O HOOK UNIFICADO
export interface UnifiedDataReturn {
  products: Product[];
  allProducts: Product[];
  categories: Category[];
  markets: string[];
  brands: string[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchProducts: (query: string) => Promise<Product[]>;
  loadProductsByCategory: (categoryId: string) => Promise<Product[]>;
  loadProducts: () => Promise<void>;
  reloadData: () => Promise<void>;
  clearCache: () => void;
  getSmartSuggestions: (query?: string) => string[];
  
  // Multi-source specific (se disponível)
  searchMultiSource?: (query: string, markets?: string[]) => Promise<Product[]>;
  loadMarketProducts?: (marketId: string, query?: string) => Promise<Product[]>;
  getMultiSourceStats?: () => any;
  lastQuery?: MultiSourceResult;
  
  // Metadata
  dataSource: DataSourceType;
  isMultiSourceEnabled: boolean;
}