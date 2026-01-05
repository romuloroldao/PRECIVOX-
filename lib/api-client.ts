/**
 * Helper para construir URLs de API baseadas no ambiente
 * - Em desenvolvimento: usa http://localhost:PORT
 * - Em produção: usa NEXT_PUBLIC_API_URL ou fallback para o domínio atual
 */

/**
 * Obtém a URL base da API baseada no ambiente
 */
export function getApiUrl(): string {
  // Em cliente (browser), sempre usa relativo ou variável pública
  if (typeof window !== 'undefined') {
    // Se NEXT_PUBLIC_API_URL estiver definida, usa ela
    const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (publicApiUrl) {
      // Garante que não tenha /api duplicado
      return publicApiUrl.replace(/\/api\/?$/, '');
    }
    
    // Fallback: usa relativo (será proxied pelo Next.js)
    return '';
  }
  
  // Em servidor (SSR), usa variável de ambiente ou fallback
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    return apiUrl.replace(/\/api\/?$/, '');
  }
  
  // Fallback para desenvolvimento local
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || '3001';
    return `http://localhost:${port}`;
  }
  
  // Fallback para produção (assume mesmo domínio)
  return '';
}

/**
 * Constrói uma URL completa para uma rota da API
 * @param path - Caminho da rota (ex: '/api/produtos/analises-precos')
 */
export function getApiEndpoint(path: string): string {
  const baseUrl = getApiUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Se baseUrl estiver vazio (relativo), retorna apenas o path
  if (!baseUrl) {
    return cleanPath;
  }
  
  // Garante que não haja duplicação de /api
  if (cleanPath.startsWith('/api')) {
    return `${baseUrl}${cleanPath}`;
  }
  
  return `${baseUrl}/api${cleanPath}`;
}

/**
 * Tipos de erro da API
 */
export interface ApiError {
  message: string;
  code?: string;
  status: number;
  retryable: boolean;
}

/**
 * Resultado de uma requisição API
 */
export interface ApiResult<T = any> {
  data: T | null;
  error: ApiError | null;
  success: boolean;
}

/**
 * Opções para requisições API
 */
export interface ApiFetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  onError?: (error: ApiError) => void;
  skipInterceptors?: boolean; // Pular interceptors (útil para refresh token)
}

/**
 * Faz uma requisição fetch com tratamento de erro robusto
 * Automaticamente adiciona tokens de autenticação
 * Implementa retry automático para erros retryable
 * Aplica interceptors para tratamento centralizado de erros
 */
export async function apiFetch<T = any>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<ApiResult<T>> {
  const {
    retries = 0,
    retryDelay = 1000,
    timeout = 30000,
    onError,
    skipInterceptors = false,
    ...fetchOptions
  } = options;

  // Carregar interceptors se não estiverem desabilitados
  let interceptors: any[] = [];
  if (!skipInterceptors && typeof window !== 'undefined') {
    try {
      const { defaultInterceptors } = await import('@/lib/api-client-interceptors');
      interceptors = defaultInterceptors;
    } catch (e) {
      // Ignorar se interceptors não disponíveis
    }
  }

  const url = getApiEndpoint(path);
  
  const makeRequest = async (attempt: number): Promise<Response> => {
    // Criar AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Tentar usar fetch autenticado (adiciona token automaticamente)
      let response: Response;
      
      try {
        const { authenticatedFetch } = await import('@/lib/auth-client');
        response = await authenticatedFetch(url, {
          ...fetchOptions,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        });
      } catch {
        // Fallback para fetch normal (se auth-client não disponível)
        response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
          credentials: 'include', // Incluir cookies de autenticação (NextAuth)
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        });
      }

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  const createError = (status: number, message: string, code?: string): ApiError => {
    // Erros retryable: 429 (rate limit), 500, 502, 503, 504 (server errors)
    const retryable = status === 429 || status >= 500;
    
    return {
      message,
      code,
      status,
      retryable,
    };
  };

  let lastError: ApiError | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await makeRequest(attempt);
      const status = response.status;
      
      // Se não for sucesso, verifica se deve retryar
      if (!response.ok) {
        let errorMessage = 'Erro na requisição';
        let errorCode: string | undefined;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorData.details || errorMessage;
          errorCode = errorData.code;
        } catch {
          // Se não conseguir parsear JSON, usa mensagem padrão baseada no status
          switch (status) {
            case 404:
              errorMessage = 'Recurso não encontrado';
              errorCode = 'NOT_FOUND';
              break;
            case 401:
              errorMessage = 'Não autenticado. Faça login novamente.';
              errorCode = 'UNAUTHORIZED';
              // 401 não é retryable - requer ação do usuário
              break;
            case 403:
              errorMessage = 'Acesso negado. Você não tem permissão para esta ação.';
              errorCode = 'FORBIDDEN';
              break;
            case 429:
              errorMessage = 'Muitas requisições. Aguarde um momento.';
              errorCode = 'RATE_LIMIT';
              break;
            case 500:
              errorMessage = 'Erro interno do servidor. Tente novamente.';
              errorCode = 'INTERNAL_ERROR';
              break;
            case 502:
            case 503:
            case 504:
              errorMessage = 'Serviço temporariamente indisponível. Tente novamente.';
              errorCode = 'SERVICE_UNAVAILABLE';
              break;
            default:
              errorMessage = `Erro ${status}`;
          }
        }
        
        const error = createError(status, errorMessage, errorCode);
        lastError = error;

        // Aplicar interceptors de erro
        if (!skipInterceptors) {
          for (const interceptor of interceptors) {
            if (interceptor.onError) {
              try {
                await interceptor.onError(error);
              } catch (e) {
                console.error('Erro no interceptor:', e);
              }
            }
          }
        }

        // Se for retryable e ainda há tentativas, aguarda e tenta novamente
        if (error.retryable && attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }

        // Se não for retryable ou acabaram as tentativas, retorna erro
        if (onError) {
          onError(error);
        }

        return {
          data: null,
          error,
          success: false,
        };
      }

      // Parse da resposta
      let data: T;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text as any;
      }

      // Extrair data se estiver em formato { success: true, data: ... }
      const finalData = (data as any)?.data !== undefined && (data as any)?.success 
        ? (data as any).data 
        : data;

      return {
        data: finalData,
        error: null,
        success: true,
      };
    } catch (error) {
      // Erro de rede ou timeout
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          lastError = createError(0, 'Timeout: requisição demorou muito para responder', 'TIMEOUT');
        } else {
          lastError = createError(0, error.message || 'Erro de conexão', 'NETWORK_ERROR');
        }
      } else {
        lastError = createError(0, 'Erro desconhecido', 'UNKNOWN');
      }

      // Se for retryable e ainda há tentativas, aguarda e tenta novamente
      if (lastError.retryable && attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }

      if (onError && lastError) {
        onError(lastError);
      }

      return {
        data: null,
        error: lastError,
        success: false,
      };
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  return {
    data: null,
    error: lastError || createError(0, 'Erro desconhecido', 'UNKNOWN'),
    success: false,
  };
}

