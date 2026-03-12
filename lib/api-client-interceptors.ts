/**
 * Interceptors para API Client
 * Centraliza tratamento de erros HTTP comuns
 */

import { ApiError } from './api-client';

export interface ApiInterceptor {
  onRequest?: (url: string, options: RequestInit) => void | Promise<void>;
  onResponse?: (response: Response) => void | Promise<void>;
  onError?: (error: ApiError) => void | Promise<void>;
}

/**
 * Interceptor para erros 401 (Unauthorized)
 * Limpa tokens próprios; UI decide se deve redirecionar.
 */
export const unauthorizedInterceptor: ApiInterceptor = {
  onError: async (error: ApiError) => {
    if (error.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;

      // Nunca redirecionar se já estamos na tela de login
      if (path.startsWith('/login')) {
        return;
      }

      // Limpar tokens de sessão do AuthClient (tokens próprios da Auth V2)
      try {
        const { authClient } = await import('@/lib/auth-client');
        authClient.clearTokens();
      } catch (e) {
        console.error('Erro ao limpar tokens:', e);
      }
      // Não fazer redirect automático aqui para evitar loops.
      // As páginas (ex.: dashboard admin) já tratam 401/403 e podem exibir CTA de login.
    }
  },
};

/**
 * Interceptor para erros 403 (Forbidden)
 * Loga erro mas não redireciona (usuário pode não ter permissão)
 */
export const forbiddenInterceptor: ApiInterceptor = {
  onError: async (error: ApiError) => {
    if (error.status === 403) {
      console.warn('[API] Acesso negado:', error.message);
      // Não redireciona, apenas loga
      // O componente pode decidir o que fazer
    }
  },
};

/**
 * Interceptor para erros 404 (Not Found)
 * Loga erro mas não quebra a aplicação
 */
export const notFoundInterceptor: ApiInterceptor = {
  onError: async (error: ApiError) => {
    if (error.status === 404) {
      console.warn('[API] Recurso não encontrado:', error.message);
      // Não quebra a aplicação, apenas loga
    }
  },
};

/**
 * Interceptor para erros 500+ (Server Errors)
 * Loga erro detalhado
 */
export const serverErrorInterceptor: ApiInterceptor = {
  onError: async (error: ApiError) => {
    if (error.status >= 500) {
      console.error('[API] Erro do servidor:', {
        status: error.status,
        message: error.message,
        code: error.code,
      });
    }
  },
};

/**
 * Interceptor para adicionar token JWT automaticamente
 */
export const authInterceptor: ApiInterceptor = {
  onRequest: async (url: string, options: RequestInit) => {
    if (typeof window !== 'undefined') {
      try {
        const { authClient } = await import('@/lib/auth-client');
        const token = await authClient.getAccessToken();
        
        if (token && options.headers) {
          const headers = options.headers as HeadersInit;
          (headers as any)['Authorization'] = `Bearer ${token}`;
        }
      } catch (e) {
        // Ignorar erro silenciosamente (pode não ter token)
      }
    }
  },
};

/**
 * Lista de interceptors padrão
 */
export const defaultInterceptors: ApiInterceptor[] = [
  authInterceptor,
  unauthorizedInterceptor,
  forbiddenInterceptor,
  notFoundInterceptor,
  serverErrorInterceptor,
];

