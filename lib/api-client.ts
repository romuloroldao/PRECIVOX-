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
 * Faz uma requisição fetch com tratamento de erro melhorado
 */
export async function apiFetch<T = any>(
  path: string,
  options?: RequestInit
): Promise<{
  data: T | null;
  error: string | null;
  status: number;
}> {
  const url = getApiEndpoint(path);
  
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Incluir cookies de autenticação (NextAuth)
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const status = response.status;
    
    // Se não for sucesso, retorna erro
    if (!response.ok) {
      let errorMessage = 'Erro na requisição';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Se não conseguir parsear JSON, usa mensagem padrão baseada no status
        switch (status) {
          case 404:
            errorMessage = 'Recurso não encontrado';
            break;
          case 401:
            errorMessage = 'Não autenticado';
            break;
          case 403:
            errorMessage = 'Acesso negado';
            break;
          case 500:
            errorMessage = 'Erro interno do servidor';
            break;
          default:
            errorMessage = `Erro ${status}`;
        }
      }
      
      return {
        data: null,
        error: errorMessage,
        status,
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

    return {
      data,
      error: null,
      status,
    };
  } catch (error) {
    console.error(`Erro ao fazer requisição para ${url}:`, error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      status: 0,
    };
  }
}

