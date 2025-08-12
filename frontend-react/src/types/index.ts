// src/types/index.ts - TIPOS CENTRALIZADOS PRECIVOX v5.0

// Re-export dos tipos principais
export * from './security';
export * from './permissions';

// ===================================
// 🎭 TIPOS DE PERSONAS E NAVEGAÇÃO
// ===================================

export type PersonaType = 'cliente' | 'gestor' | 'admin' | 'public';

export interface PersonaRoute {
  path: string;
  component: string;
  title: string;
  icon?: string;
  badge?: string;
  permissions?: string[];
  exact?: boolean;
}

export interface PersonaNavigation {
  persona: PersonaType;
  routes: PersonaRoute[];
  defaultRoute: string;
  homeRoute: string;
}

// ===================================
// 🔍 TIPOS DE BUSCA E PRODUTOS
// ===================================

export interface Product {
  id: string;
  name: string;
  brand?: string;
  category: string;
  description?: string;
  images: string[];
  price: number;
  originalPrice?: number;
  discount?: number;
  store: Store;
  availability: 'in_stock' | 'limited' | 'out_of_stock';
  rating?: number;
  reviewCount?: number;
  specifications?: Record<string, any>;
  nutritionalInfo?: NutritionalInfo;
  barcode?: string;
  sku?: string;
  lastUpdated: Date;
  priceHistory?: PriceHistory[];
  similar?: string[];
  tags?: string[];
}

export interface SearchFilters {
  priceMin: string;
  priceMax: string;
  onlyPromotions: boolean;
  onlyInStock: boolean;
  maxDistance: string;
  mercado: string;
  marca: string;
  rating: number;
  category: string;
  hasPromotion: boolean;
  isNew: boolean;
  isBestPrice: boolean;
  minRating: number;
  maxRating: number;
  sortBy?: 'rating' | 'price' | 'name' | 'distance' | 'discount' | 'popularity' | 'relevance';
  orderBy?: 'asc' | 'desc';
}

export interface Store {
  id: string;
  name: string;
  logo?: string;
  address: string;
  phone?: string;
  website?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  rating?: number;
  distance?: number;
  isOpen?: boolean;
  openingHours?: OpeningHours;
  chainId?: string;
}

export interface OpeningHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface NutritionalInfo {
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
}

export interface PriceHistory {
  date: Date;
  price: number;
  store: string;
}

export interface SearchFilters {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  brands?: string[];
  stores?: string[];
  availability?: string;
  rating?: number;
  discount?: boolean;
  location?: {
    radius: number;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  sortBy?: 'price' | 'name' | 'rating' | 'distance' | 'discount' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  products: Product[];
  total: number;
  page: number;
  size: number;
  hasMore: boolean;
  suggestions?: string[];
  filters?: {
    categories: string[];
    brands: string[];
    stores: string[];
    priceRange: {
      min: number;
      max: number;
    };
  };
  searchTime: number;
  query: string;
}

// ===================================
// 📝 TIPOS DE LISTAS
// ===================================

export interface Lista {
  id: string;
  name: string;
  description?: string;
  items: ListaItem[];
  owner: string;
  shared?: boolean;
  sharedWith?: string[];
  category?: string;
  color?: string;
  icon?: string;
  totalValue?: number;
  totalItems?: number;
  progress?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  status: 'active' | 'completed' | 'archived';
  template?: boolean;
  tags?: string[];
  notifications?: boolean;
  reminders?: ListaReminder[];
}

export interface ListaItem {
  id: string;
  productId?: string;
  productName: string;
  brand?: string;
  quantity: number;
  unit: string;
  price?: number;
  targetPrice?: number;
  store?: string;
  notes?: string;
  category?: string;
  checked: boolean;
  addedAt: Date;
  checkedAt?: Date;
  priority?: 'low' | 'medium' | 'high';
  alternatives?: string[];
}

export interface ListaReminder {
  id: string;
  type: 'date' | 'location' | 'price';
  value: any;
  message: string;
  active: boolean;
}

// ===================================
// 🔔 TIPOS DE ALERTAS E NOTIFICAÇÕES
// ===================================

export interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  targetPrice: number;
  currentPrice: number;
  store?: string;
  active: boolean;
  triggered: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  lastChecked: Date;
  frequency: 'realtime' | 'daily' | 'weekly';
  conditions: AlertCondition[];
}

export interface AlertCondition {
  type: 'price_drop' | 'price_increase' | 'availability' | 'discount';
  operator: 'eq' | 'lt' | 'lte' | 'gt' | 'gte';
  value: any;
  percentage?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'price_alert' | 'list_shared' | 'system' | 'promotion';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
  actionUrl?: string;
  actionText?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

// ===================================
// 📊 TIPOS DE ANALYTICS E DASHBOARD
// ===================================

export interface DashboardMetric {
  id: string;
  name: string;
  value: number | string;
  previousValue?: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  unit?: string;
  format?: 'number' | 'currency' | 'percentage' | 'text';
  trend?: number[];
  target?: number;
  status?: 'good' | 'warning' | 'critical';
  description?: string;
  updatedAt: Date;
}

export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap';
  title: string;
  data: any[];
  xAxis?: string;
  yAxis?: string;
  options?: Record<string, any>;
  updatedAt: Date;
}

export interface InsightCard {
  id: string;
  type: 'tip' | 'warning' | 'success' | 'info' | 'trend';
  title: string;
  content: string;
  action?: {
    text: string;
    url: string;
  };
  priority: number;
  category: string;
  personalized: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

// ===================================
// 🌍 TIPOS DE LOCALIZAÇÃO
// ===================================

export interface Location {
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  accuracy?: number;
  timestamp?: Date;
}

// ===================================
// ⚙️ TIPOS DE CONFIGURAÇÕES
// ===================================

export interface AppConfig {
  features: FeatureFlags;
  limits: UserLimits;
  api: ApiConfig;
  ui: UiConfig;
}

export interface FeatureFlags {
  aiSearch: boolean;
  voiceSearch: boolean;
  imageSearch: boolean;
  collaboration: boolean;
  analytics: boolean;
  priceForecasting: boolean;
  bulkOperations: boolean;
  realTimeUpdates: boolean;
  darkMode: boolean;
  betaFeatures: boolean;
}

export interface UserLimits {
  maxLists: number;
  maxItemsPerList: number;
  maxAlerts: number;
  maxSearchesPerDay: number;
  maxExportsPerMonth: number;
  apiRateLimit: number;
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  rateLimit: number;
  version: string;
}

export interface UiConfig {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  animations: boolean;
  sounds: boolean;
  compactMode: boolean;
}

// ===================================
// 🔄 TIPOS DE API E RESPONSES
// ===================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    size?: number;
    total?: number;
    hasMore?: boolean;
    timestamp: Date;
    version: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    size: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ===================================
// 🎯 TIPOS DE EVENTOS E ANALYTICS
// ===================================

export interface AnalyticsEvent {
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  properties?: Record<string, any>;
  context?: {
    page: string;
    userAgent: string;
    platform: string;
    screen: {
      width: number;
      height: number;
    };
  };
}

// ===================================
// 🚨 TIPOS DE ERROS
// ===================================

export interface AppError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  context?: Record<string, any>;
}

export type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
};

// ===================================
// 📱 TIPOS DE UI COMPONENTS
// ===================================

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  footer?: React.ReactNode;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    text: string;
    onClick: () => void;
  };
  timestamp: Date;
}

// ===================================
// 🔒 TIPOS DE VALIDAÇÃO
// ===================================

export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
}

export interface FormField {
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  rules?: ValidationRule[];
  options?: Array<{ value: any; label: string }>;
  disabled?: boolean;
  help?: string;
}

// ===================================
// 📤 EXPORTS PRINCIPAIS
// ===================================

export type {
  // Personas
  PersonaType,
  PersonaRoute,
  PersonaNavigation,
  
  // Produtos e Busca
  Product,
  Store,
  SearchFilters,
  SearchResult,
  
  // Listas
  Lista,
  ListaItem,
  ListaReminder,
  
  // Alertas
  PriceAlert,
  AlertCondition,
  Notification,
  
  // Dashboard
  DashboardMetric,
  ChartData,
  InsightCard,
  
  // Configurações
  AppConfig,
  FeatureFlags,
  UserLimits,
  
  // API
  ApiResponse,
  PaginatedResponse,
  
  // Eventos
  AnalyticsEvent,
  
  // Erros
  AppError,
  ErrorBoundaryState,
  
  // UI
  LoadingState,
  ModalProps,
  ToastMessage,
  
  // Validação
  ValidationRule,
  ValidationResult,
  FormField,
  
  // Localização
  Location
};