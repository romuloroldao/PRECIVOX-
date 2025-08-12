// frontend-react/src/services/api.ts
import { API_CONFIG, apiRequest } from '../config/api';

// ✅ Detectar ambiente e usar URL apropriada
const getApiBaseURL = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    console.log('🌍 API Service - Detectando ambiente:', {
      hostname,
      protocol,
      fullOrigin: window.location.origin
    });
    
    // Se estamos acessando via IP externo ou domínio, usar proxy
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      console.log('🔄 API Service - Usando URL relativa para proxy');
      return '/api'; // URL relativa para proxy do vite/nginx
    }
  }
  
  // Se estamos em localhost, usar URL direta do backend
  console.log('🏠 API Service - Usando URL direta do backend');
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseURL();
console.log('📡 API Service - URL Base escolhida:', API_BASE_URL);

export interface SearchProduct {
  id: string;
  name: string;
  price: number;
  market_name: string;
  market_address: string;
  distance?: number;
}

export interface SearchParams {
  query: string;
  latitude?: number;
  longitude?: number;
  limit?: number;
}

export interface MarketAnalytics {
  market_id: string;
  total_searches: number;
  popular_products: Array<{
    product: string;
    searches: number;
  }>;
  peak_hours: Array<{
    hour: number;
    searches: number;
  }>;
  conversion_insights: Array<{
    insight: string;
    impact: string;
  }>;
}

// ✅ Função principal de busca - CORRIGIDA
export const searchProducts = async (params: SearchParams): Promise<SearchProduct[]> => {
  try {
    // Montar parâmetros de busca corretamente
    const searchParams = new URLSearchParams();
    searchParams.append('q', params.query);
    
    if (params.latitude) searchParams.append('latitude', params.latitude.toString());
    if (params.longitude) searchParams.append('longitude', params.longitude.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    // ✅ Endpoint correto que bate com o backend
    const response = await fetch(`${API_BASE_URL}/produtos?${searchParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    
    // ✅ Retornar os produtos do formato do backend
    return data.produtos || [];
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

// ✅ Analytics para mercados - CORRIGIDO
export const getMarketAnalytics = async (marketId: string): Promise<MarketAnalytics> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/market/${marketId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Analytics failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Market analytics error:', error);
    throw error;
  }
};

// ✅ Correlação de produtos - CORRIGIDO
export const getProductCorrelation = async (marketId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/correlation/${marketId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Correlation failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Product correlation error:', error);
    throw error;
  }
};

// ✅ Otimização de preços - CORRIGIDO
export const getOptimizationInsights = async (marketId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/optimization/${marketId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Optimization failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Optimization insights error:', error);
    throw error;
  }
};

// ✅ Dashboard metrics - CORRIGIDO para bater com o backend
export const getDashboardMetrics = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Dashboard failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    throw error;
  }
};

// ✅ Lista de mercados - CORRIGIDO
export const getMarkets = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/mercados`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Markets failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Markets error:', error);
    throw error;
  }
};

// ✅ Categorias - CORRIGIDO
export const getCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/categorias`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Categories failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Categories error:', error);
    throw error;
  }
};

// ✅ FUNÇÕES EXTRAS BASEADAS NO SEU BACKEND

// Obter contexto de localização
export const getLocationContext = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/location/context`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Location context failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Location context error:', error);
    throw error;
  }
};

// Chat com IA
export const chatWithAI = async (pergunta: string, contexto = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pergunta,
        contexto
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Chat failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('AI Chat error:', error);
    throw error;
  }
};

// Insights da IA
export const getAIInsights = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/ai-insights`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`AI Insights failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('AI Insights error:', error);
    throw error;
  }
};

// Correlações de produtos reais
export const getProductCorrelations = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/correlations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Correlations failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Product correlations error:', error);
    throw error;
  }
};

// Health check do backend
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
};

// ✅ EXPORT DE TODAS AS FUNÇÕES
export default {
  searchProducts,
  getMarketAnalytics,
  getProductCorrelation,
  getOptimizationInsights,
  getDashboardMetrics,
  getMarkets,
  getCategories,
  getLocationContext,
  chatWithAI,
  getAIInsights,
  getProductCorrelations,
  checkBackendHealth
};