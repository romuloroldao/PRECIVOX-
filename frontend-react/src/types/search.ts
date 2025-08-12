// src/types/search.ts
// 🔍 TIPOS PARA COMPONENTES DE BUSCA - PRECIVOX v4.0

import { ReactNode } from 'react';
import { Product } from './index';

// ===================================
// 💡 SEARCH SUGGESTIONS TYPES
// ===================================

export type SuggestionType = 
  | 'history' 
  | 'trending' 
  | 'ai' 
  | 'popular' 
  | 'category' 
  | 'location' 
  | 'brand'
  | 'smart'
  | 'product'
  | 'store';

export interface SearchSuggestion {
  id: string;
  text: string;
  type: SuggestionType;
  metadata?: {
    // Informações gerais
    category?: string;
    subcategory?: string;
    description?: string;
    
    // Métricas
    popularity?: number;
    searchCount?: number;
    conversionRate?: number;
    
    // Preços e promoções
    price?: string;
    priceRange?: {
      min: number;
      max: number;
    };
    discount?: string;
    hasPromotion?: boolean;
    
    // Localização
    location?: string;
    distance?: number;
    region?: string;
    
    // Marca e loja
    brand?: string;
    store?: string;
    storeChain?: string;
    
    // IA e analytics
    aiConfidence?: number;
    aiReason?: string;
    matchScore?: number;
    relevanceScore?: number;
    
    // Trending
    trendDirection?: 'up' | 'down' | 'stable';
    trendPercentage?: number;
    
    // Contexto temporal
    lastSearched?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    
    // Dados extras
    icon?: string;
    color?: string;
    tags?: string[];
    featured?: boolean;
  };
}

export interface SuggestionsState {
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  error?: string;
  lastQuery: string;
  lastUpdated: Date;
}

export interface SuggestionsConfig {
  maxSuggestions: number;
  enableAI: boolean;
  enableHistory: boolean;
  enableTrending: boolean;
  enableCategories: boolean;
  enableLocation: boolean;
  showMetadata: boolean;
  groupByType: boolean;
  sortBy: 'relevance' | 'popularity' | 'recent' | 'alphabetical';
}

// ===================================
// ⏳ LOADING STATES TYPES
// ===================================

export type LoadingStateType = 
  | 'initial'
  | 'searching'
  | 'loading-results'
  | 'loading-more'
  | 'no-connection'
  | 'slow-network'
  | 'ai-processing'
  | 'error'
  | 'timeout'
  | 'cancelled';

export type LoadingVariant = 
  | 'full'
  | 'inline' 
  | 'overlay'
  | 'skeleton'
  | 'minimal'
  | 'compact';

export interface LoadingState {
  type: LoadingStateType;
  isLoading: boolean;
  progress?: number; // 0-100
  estimatedTime?: number; // em segundos
  retryCount?: number;
  startTime?: Date;
  message?: string;
  details?: string;
  canCancel?: boolean;
  canRetry?: boolean;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
  };
}

export interface LoadingConfig {
  showProgress: boolean;
  showEstimatedTime: boolean;
  showTips: boolean;
  showRetryButton: boolean;
  showCancelButton: boolean;
  autoRetry: boolean;
  maxRetries: number;
  retryDelay: number; // em ms
  timeoutDuration: number; // em ms
}

export interface LoadingTip {
  id: string;
  text: string;
  type: LoadingStateType[];
  icon?: string;
  priority: number;
}

// ===================================
// 🎛️ FILTERS SECTION TYPES
// ===================================

export type FiltersSectionVariant = 'full' | 'compact' | 'minimal';

export type FiltersTab = 'categories' | 'filters' | 'stats' | 'location' | 'advanced';

export interface FiltersSection {
  isExpanded: boolean;
  activeTab: FiltersTab;
  showStats: boolean;
  showLocation: boolean;
  showAdvanced: boolean;
  variant: FiltersSectionVariant;
}

export interface FiltersSectionState {
  selectedCategory: string;
  activeFilters: Record<string, any>;
  appliedFilters: Record<string, any>;
  hasActiveFilters: boolean;
  filtersCount: number;
  lastApplied: Date;
}

export interface FiltersSectionConfig {
  enableTabs: boolean;
  enableExpansion: boolean;
  enableStats: boolean;
  enableLocation: boolean;
  enableAdvanced: boolean;
  enableApplyButton: boolean;
  enableClearButton: boolean;
  rememberState: boolean;
  autoApply: boolean;
  maxHeight: number;
}

// ===================================
// 🔍 SEARCH CONTEXT TYPES
// ===================================

export interface SearchContext {
  // Query info
  query: string;
  originalQuery: string;
  normalizedQuery: string;
  queryHistory: string[];
  
  // Results
  results: Product[];
  totalResults: number;
  hasMore: boolean;
  page: number;
  resultsPerPage: number;
  
  // State
  isLoading: boolean;
  loadingState: LoadingState;
  error?: string;
  
  // Filters
  filters: Record<string, any>;
  appliedFilters: Record<string, any>;
  availableFilters: string[];
  
  // Suggestions
  suggestions: SearchSuggestion[];
  suggestionsConfig: SuggestionsConfig;
  
  // Analytics
  searchTime: number;
  totalSearchTime: number;
  searchId: string;
  sessionId: string;
  
  // Location
  location?: {
    city: string;
    state: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  
  // User preferences
  viewMode: 'grid' | 'list' | 'card' | 'compact' | 'table';
  sortBy: string;
  preferences: {
    maxDistance?: number;
    favoriteStores?: string[];
    priceRange?: {
      min: number;
      max: number;
    };
  };
}

// ===================================
// 📊 SEARCH ANALYTICS TYPES
// ===================================

export interface SearchAnalytics {
  // Basic metrics
  totalSearches: number;
  uniqueQueries: number;
  avgSearchTime: number;
  successRate: number;
  
  // User behavior
  mostSearchedTerms: Array<{
    term: string;
    count: number;
    percentage: number;
  }>;
  
  searchPatterns: Array<{
    pattern: string;
    frequency: number;
    avgResults: number;
  }>;
  
  // Performance
  avgResponseTime: number;
  errorRate: number;
  timeoutRate: number;
  retryRate: number;
  
  // Engagement
  clickThroughRate: number;
  conversionRate: number;
  avgTimeOnResults: number;
  bouncedSearches: number;
  
  // AI metrics
  aiSuggestionsUsed: number;
  aiSuggestionsSuccess: number;
  avgAiConfidence: number;
  
  // Filters usage
  filtersUsageRate: number;
  mostUsedFilters: string[];
  avgFiltersPerSearch: number;
}

// ===================================
// 🎯 SEARCH EVENTS TYPES
// ===================================

export type SearchEventType = 
  | 'search_started'
  | 'search_completed'
  | 'search_failed'
  | 'suggestion_clicked'
  | 'suggestion_generated'
  | 'filter_applied'
  | 'filter_cleared'
  | 'result_clicked'
  | 'load_more'
  | 'search_cancelled'
  | 'search_timeout'
  | 'voice_search_used'
  | 'image_search_used';

export interface SearchEvent {
  type: SearchEventType;
  timestamp: Date;
  sessionId: string;
  searchId?: string;
  userId?: string;
  data: {
    query?: string;
    suggestion?: SearchSuggestion;
    filter?: {
      name: string;
      value: any;
      previous?: any;
    };
    result?: {
      productId: string;
      position: number;
      relevanceScore?: number;
    };
    error?: {
      code: string;
      message: string;
    };
    performance?: {
      duration: number;
      resultsCount: number;
      apiCalls: number;
    };
    context?: {
      location?: string;
      device?: string;
      browser?: string;
      viewport?: {
        width: number;
        height: number;
      };
    };
  };
}

// ===================================
// 🔄 SEARCH HOOKS TYPES
// ===================================

export interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  maxResults?: number;
  enableSuggestions?: boolean;
  enableAnalytics?: boolean;
  enableCache?: boolean;
  cacheTimeout?: number;
  retryOnError?: boolean;
  maxRetries?: number;
}

export interface UseSearchReturn {
  // State
  query: string;
  results: Product[];
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  loadingState: LoadingState;
  error: string | null;
  
  // Actions
  search: (query: string, options?: any) => Promise<void>;
  clearSearch: () => void;
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
  cancel: () => void;
  
  // Suggestions
  generateSuggestions: (query: string) => Promise<SearchSuggestion[]>;
  selectSuggestion: (suggestion: SearchSuggestion) => void;
  
  // Analytics
  analytics: SearchAnalytics;
  trackEvent: (event: SearchEvent) => void;
  
  // Cache
  clearCache: () => void;
  refreshCache: () => Promise<void>;
}

// ===================================
// 🌐 API RESPONSE TYPES
// ===================================

export interface SearchApiResponse {
  success: boolean;
  data: {
    products: Product[];
    total: number;
    page: number;
    hasMore: boolean;
    suggestions?: SearchSuggestion[];
    filters?: Record<string, any>;
    analytics?: {
      searchTime: number;
      resultsProcessed: number;
      aiProcessingTime?: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    requestId: string;
    timestamp: Date;
    version: string;
    source: 'api' | 'cache' | 'fallback';
  };
}

export interface SuggestionsApiResponse {
  success: boolean;
  data: {
    suggestions: SearchSuggestion[];
    total: number;
    processingTime: number;
    aiGenerated: number;
    cached: number;
  };
  error?: {
    code: string;
    message: string;
  };
  metadata: {
    requestId: string;
    timestamp: Date;
    query: string;
    source: 'ai' | 'trending' | 'history' | 'cache';
  };
}

// ===================================
// 🎨 UI COMPONENT PROPS TYPES
// ===================================

export interface SearchSuggestionsProps {
  searchQuery: string;
  isVisible: boolean;
  isLoading?: boolean;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  trendingSearches?: string[];
  maxSuggestions?: number;
  showCategories?: boolean;
  showTrending?: boolean;
  showHistory?: boolean;
  showAI?: boolean;
  showPopular?: boolean;
  variant?: 'dropdown' | 'fullscreen' | 'inline' | 'modal';
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom' | 'top';
  onSelectSuggestion: (suggestion: string | SearchSuggestion) => void;
  onClearHistory?: () => void;
  onRemoveHistoryItem?: (item: string) => void;
  onRequestAI?: (query: string) => void;
  enableAI?: boolean;
  enableVoiceSearch?: boolean;
  enableImageSearch?: boolean;
  className?: string;
}

export interface SearchLoadingStatesProps {
  type: LoadingStateType;
  searchQuery?: string;
  progress?: number;
  estimatedTime?: number;
  retryCount?: number;
  onRetry?: () => void;
  onCancel?: () => void;
  variant?: LoadingVariant;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  showTips?: boolean;
  className?: string;
}

export interface SearchFiltersSectionProps {
  isExpanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  filters?: any;
  onFiltersChange?: (filters: any) => void;
  searchQuery?: string;
  resultsCount?: number;
  searchTime?: number;
  currentLocation?: string;
  showStats?: boolean;
  showLocation?: boolean;
  showAdvancedFilters?: boolean;
  variant?: FiltersSectionVariant;
  onClearFilters?: () => void;
  onApplyFilters?: () => void;
  className?: string;
}

// ===================================
// 🔧 UTILITY TYPES
// ===================================

export type SearchQueryNormalizer = (query: string) => string;

export type SearchResultSorter = (a: Product, b: Product, sortBy: string) => number;

export type SearchFilterPredicate = (product: Product, filters: any) => boolean;

export interface SearchUtils {
  normalizeQuery: SearchQueryNormalizer;
  sortResults: SearchResultSorter;
  filterResults: SearchFilterPredicate;
  highlightMatches: (text: string, query: string) => ReactNode;
  generateQuerySuggestions: (query: string) => string[];
  calculateRelevanceScore: (product: Product, query: string) => number;
  extractKeywords: (query: string) => string[];
  detectIntent: (query: string) => 'product' | 'category' | 'brand' | 'price' | 'location';
}

// ===================================
// 📈 PERFORMANCE TYPES
// ===================================

export interface SearchPerformanceMetrics {
  // Timing
  queryTime: number;
  apiTime: number;
  renderTime: number;
  totalTime: number;
  
  // Data
  resultsCount: number;
  suggestionsCount: number;
  filtersCount: number;
  
  // Cache
  cacheHits: number;
  cacheMisses: number;
  cacheSize: number;
  
  // Network
  requestsCount: number;
  bytesTransferred: number;
  compressionRatio: number;
  
  // Errors
  errorsCount: number;
  warningsCount: number;
  retrysCount: number;
}

export interface SearchOptimizations {
  enableDebounce: boolean;
  debounceMs: number;
  enableCache: boolean;
  cacheSize: number;
  cacheTTL: number;
  enableCompression: boolean;
  enableLazyLoading: boolean;
  preloadSuggestions: boolean;
  prefetchResults: boolean;
  maxConcurrentRequests: number;
}

// ===================================
// 🔐 SECURITY TYPES
// ===================================

export interface SearchSecurityConfig {
  sanitizeQuery: boolean;
  maxQueryLength: number;
  allowedCharacters: RegExp;
  rateLimit: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
  xssProtection: boolean;
  sqlInjectionProtection: boolean;
  logSearchQueries: boolean;
  encryptSensitiveData: boolean;
}

export interface SearchAuditLog {
  timestamp: Date;
  sessionId: string;
  userId?: string;
  query: string;
  sanitizedQuery: string;
  ipAddress: string;
  userAgent: string;
  results: number;
  blocked: boolean;
  reason?: string;
  riskScore: number;
}

// ===================================
// 🌍 INTERNATIONALIZATION TYPES
// ===================================

export interface SearchI18nConfig {
  locale: string;
  currency: string;
  dateFormat: string;
  numberFormat: string;
  rtl: boolean;
  translations: {
    placeholders: Record<string, string>;
    messages: Record<string, string>;
    labels: Record<string, string>;
    errors: Record<string, string>;
    tips: Record<string, string>;
  };
}

export interface SearchLocalization {
  language: string;
  region: string;
  currency: string;
  priceFormat: (value: number) => string;
  dateFormat: (date: Date) => string;
  distanceFormat: (distance: number) => string;
  pluralize: (count: number, singular: string, plural: string) => string;
  translate: (key: string, params?: Record<string, any>) => string;
}

// ===================================
// 📱 RESPONSIVE TYPES
// ===================================

export type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ResponsiveConfig {
  breakpoints: Record<BreakpointKey, number>;
  components: {
    suggestions: {
      [K in BreakpointKey]?: Partial<SearchSuggestionsProps>;
    };
    loading: {
      [K in BreakpointKey]?: Partial<SearchLoadingStatesProps>;
    };
    filters: {
      [K in BreakpointKey]?: Partial<SearchFiltersSectionProps>;
    };
  };
}

export interface ViewportInfo {
  width: number;
  height: number;
  breakpoint: BreakpointKey;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
}

// ===================================
// 🎯 ADVANCED SEARCH TYPES
// ===================================

export interface SmartSearchConfig {
  enableFuzzySearch: boolean;
  fuzzyThreshold: number;
  enableSynonyms: boolean;
  synonymsDatabase: Record<string, string[]>;
  enableAutocorrect: boolean;
  autocorrectConfidence: number;
  enableSemanticSearch: boolean;
  semanticModel: string;
  enableTrendingBoost: boolean;
  trendingWeight: number;
  enableLocationBoost: boolean;
  locationWeight: number;
  enablePersonalization: boolean;
  personalizationWeight: number;
}

export interface SearchIntent {
  type: 'product' | 'category' | 'brand' | 'comparison' | 'review' | 'price' | 'location' | 'help';
  confidence: number;
  entities: Array<{
    type: 'product' | 'brand' | 'category' | 'price' | 'location' | 'attribute';
    value: string;
    confidence: number;
    start: number;
    end: number;
  }>;
  modifiers: Array<{
    type: 'filter' | 'sort' | 'limit' | 'boost';
    value: any;
    confidence: number;
  }>;
}

export interface SearchPersonalization {
  userId: string;
  preferences: {
    categories: string[];
    brands: string[];
    priceRange: { min: number; max: number };
    stores: string[];
    location: string;
  };
  history: {
    searches: Array<{
      query: string;
      timestamp: Date;
      results: number;
      clicked: boolean;
    }>;
    purchases: Array<{
      productId: string;
      timestamp: Date;
      price: number;
      store: string;
    }>;
    views: Array<{
      productId: string;
      timestamp: Date;
      duration: number;
    }>;
  };
  patterns: {
    searchTimes: number[]; // hours of day
    searchDays: number[]; // days of week
    avgSessionDuration: number;
    preferredViewMode: string;
    avgQueryLength: number;
  };
}

// ===================================
// 🔄 STATE MANAGEMENT TYPES
// ===================================

export interface SearchState {
  // Query
  query: string;
  previousQuery: string;
  queryHistory: string[];
  
  // Results
  results: Product[];
  totalResults: number;
  hasMore: boolean;
  page: number;
  
  // Loading
  isLoading: boolean;
  loadingType: LoadingStateType;
  loadingProgress: number;
  
  // Suggestions
  suggestions: SearchSuggestion[];
  showSuggestions: boolean;
  suggestionsLoading: boolean;
  
  // Filters
  filters: Record<string, any>;
  appliedFilters: Record<string, any>;
  filtersExpanded: boolean;
  
  // UI State
  viewMode: string;
  sortBy: string;
  selectedProducts: string[];
  
  // Analytics
  searchStartTime: Date | null;
  searchDuration: number;
  searchId: string;
  
  // Error handling
  error: string | null;
  retryCount: number;
}

export type SearchAction = 
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_RESULTS'; payload: Product[] }
  | { type: 'SET_LOADING'; payload: { isLoading: boolean; type?: LoadingStateType } }
  | { type: 'SET_SUGGESTIONS'; payload: SearchSuggestion[] }
  | { type: 'SET_FILTERS'; payload: Record<string, any> }
  | { type: 'APPLY_FILTERS'; payload: Record<string, any> }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_VIEW_MODE'; payload: string }
  | { type: 'SET_SORT_BY'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'INCREMENT_RETRY' }
  | { type: 'RESET_SEARCH' }
  | { type: 'LOAD_MORE_START' }
  | { type: 'LOAD_MORE_SUCCESS'; payload: Product[] }
  | { type: 'LOAD_MORE_ERROR'; payload: string };

export type SearchReducer = (state: SearchState, action: SearchAction) => SearchState;

// ===================================
// 🔌 PLUGIN SYSTEM TYPES
// ===================================

export interface SearchPlugin {
  name: string;
  version: string;
  enabled: boolean;
  config: Record<string, any>;
  hooks: {
    beforeSearch?: (query: string, options: any) => Promise<{ query: string; options: any }>;
    afterSearch?: (results: Product[], query: string) => Promise<Product[]>;
    onSuggestion?: (suggestion: SearchSuggestion, query: string) => Promise<SearchSuggestion>;
    onError?: (error: Error, context: any) => Promise<void>;
    onAnalytics?: (event: SearchEvent) => Promise<void>;
  };
}

export interface SearchPluginRegistry {
  plugins: Map<string, SearchPlugin>;
  register: (plugin: SearchPlugin) => void;
  unregister: (name: string) => void;
  enable: (name: string) => void;
  disable: (name: string) => void;
  executeHook: (hookName: string, ...args: any[]) => Promise<any>;
}

// ===================================
// 📊 EXPORT ALL TYPES
// ===================================

export type {
  // Main interfaces
  SearchSuggestion,
  LoadingState,
  SearchContext,
  SearchAnalytics,
  SearchEvent,
  
  // Component props
  SearchSuggestionsProps,
  SearchLoadingStatesProps,
  SearchFiltersSectionProps,
  
  // Configuration
  SuggestionsConfig,
  LoadingConfig,
  FiltersSectionConfig,
  SmartSearchConfig,
  SearchSecurityConfig,
  SearchI18nConfig,
  
  // API responses
  SearchApiResponse,
  SuggestionsApiResponse,
  
  // Hooks
  UseSearchOptions,
  UseSearchReturn,
  
  // State management
  SearchState,
  SearchAction,
  SearchReducer,
  
  // Advanced features
  SearchIntent,
  SearchPersonalization,
  SearchPlugin,
  SearchPluginRegistry,
  
  // Utility types
  SearchUtils,
  SearchPerformanceMetrics,
  ViewportInfo,
  ResponsiveConfig
};