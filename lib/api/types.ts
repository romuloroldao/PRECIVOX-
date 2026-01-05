/**
 * Tipos TypeScript baseados nos schemas do OpenAPI
 * Squad B - PRECIVOX API Contracts
 */

// ============================================
// Schemas Base
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}

// ============================================
// Global Stats
// ============================================

export interface GlobalStats {
  totalUsers: number;
  totalSavings: number; // em centavos
  savingsThisMonth: number; // em centavos
  activeMarkets: number;
  lastUpdate: string; // ISO 8601
}

// ============================================
// Products
// ============================================

export interface Product {
  id: string;
  name: string;
  category: string;
  avgPrice: number; // em centavos
  priceRange: {
    min: number; // em centavos
    max: number; // em centavos
  };
  popularity: number; // 0-100
}

export interface PopularProductsResponse {
  products: Product[];
  total: number;
}

// ============================================
// Shopping Lists
// ============================================

export interface ListProduct {
  id: string;
  name: string;
  quantity: number;
  bestPrice: number; // em centavos
  avgPrice: number; // em centavos
  savings: number; // em centavos
  bestMarket: {
    id: string;
    name: string;
    distance: number; // km
  };
}

export interface ShoppingList {
  id: string;
  name: string;
  products: ListProduct[];
  estimatedSavings: number; // em centavos
  createdAt: string; // ISO 8601
  updatedAt?: string; // ISO 8601
}

export interface CreateListRequest {
  userId: string;
  name: string;
  products: string[]; // IDs dos produtos
}

// ============================================
// Price Comparison
// ============================================

export interface MarketPrice {
  marketId: string;
  marketName: string;
  price: number; // em centavos
  distance: number; // km
  inStock: boolean;
}

export interface ProductComparison {
  id: string;
  name: string;
  prices: MarketPrice[];
  bestDeal: {
    marketId: string;
    price: number; // em centavos
    savings: number; // vs. avg em centavos
  };
}

export interface CompareRequest {
  productIds: string[];
  location?: {
    lat: number;
    lng: number;
  };
}

export interface CompareResponse {
  products: ProductComparison[];
  totalSavings: number; // em centavos
}

