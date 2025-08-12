// frontend-react/src/config/api.ts
// Detectar ambiente e configurar URL base adequada
const getBaseURL = () => {
  // Se estamos no navegador
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    console.log('🌍 API Config - Detectando ambiente:', {
      hostname,
      protocol,
      fullOrigin: window.location.origin
    });
    
    // Se estamos acessando via IP ou dominio externo, usar proxy
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      console.log('🔄 Usando URL relativa para proxy (acesso externo)');
      return ''; // URL relativa para usar proxy do vite/nginx
    }
    
    // Se estamos em localhost, usar URL direta do backend
    console.log('🏠 Usando URL direta do backend (localhost)');
    return 'http://localhost:3001';
  }
  
  // Fallback para servidor
  console.log('🖥️ Fallback servidor');
  return 'http://localhost:3001';
};

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  ENDPOINTS: {
    SEARCH: '/search',
    DASHBOARD_METRICS: '/dashboard/metrics',
    ANALYTICS_MARKET: '/analytics/market',
    ANALYTICS_CORRELATION: '/analytics/correlation',
    ANALYTICS_OPTIMIZATION: '/analytics/optimization',
    PARTNERS: '/partners',
    SCRAPING_STATUS: '/scraping/status',
    REPORTS: '/reports',
    MARKETS: '/markets',
    CATEGORIES: '/categories',
    SUBSCRIBE: '/subscribe'
  }
};

// Helper function para construir URLs
export const buildApiUrl = (endpoint: string, params?: Record<string, string>) => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

// Helper function para fazer requests
export const apiRequest = async (endpoint: string, options?: RequestInit) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
};