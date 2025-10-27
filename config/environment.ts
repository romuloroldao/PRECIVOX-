// Configurações de ambiente para o sistema de imagens de produtos
export interface EnvironmentConfig {
  // APIs de busca de imagens
  googleCustomSearch: {
    apiKey: string;
    searchEngineId: string;
  };
  bingImageSearch: {
    apiKey: string;
  };
  
  // Configurações do banco de dados
  database: {
    url: string;
    maxConnections: number;
  };
  
  // Configurações de cache
  cache: {
    ttl: number; // Time to live em segundos
    maxSize: number; // Tamanho máximo do cache
  };
  
  // Configurações de rate limiting
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

export const config: EnvironmentConfig = {
  googleCustomSearch: {
    apiKey: process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || '',
    searchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID || ''
  },
  
  bingImageSearch: {
    apiKey: process.env.BING_SEARCH_API_KEY || ''
  },
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/produto_images',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10')
  },
  
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600'), // 1 hora
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000')
  },
  
  rateLimit: {
    requestsPerMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '60'),
    requestsPerHour: parseInt(process.env.RATE_LIMIT_PER_HOUR || '1000')
  }
};

// Validação das configurações obrigatórias
export function validarConfiguracao(): void {
  const erros: string[] = [];

  if (!config.googleCustomSearch.apiKey && !config.bingImageSearch.apiKey) {
    erros.push('Pelo menos uma API de busca de imagens deve ser configurada (Google ou Bing)');
  }

  if (!config.database.url) {
    erros.push('URL do banco de dados é obrigatória');
  }

  if (erros.length > 0) {
    throw new Error(`Configurações inválidas:\n${erros.join('\n')}`);
  }
}

// Exemplo de arquivo .env
export const exemploEnv = `
# APIs de busca de imagens
GOOGLE_CUSTOM_SEARCH_API_KEY=sua_chave_aqui
GOOGLE_SEARCH_ENGINE_ID=seu_id_aqui
BING_SEARCH_API_KEY=sua_chave_bing_aqui

# Banco de dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/produto_images
DB_MAX_CONNECTIONS=10

# Cache
CACHE_TTL=3600
CACHE_MAX_SIZE=1000

# Rate limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000
`;
