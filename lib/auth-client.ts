/**
 * Cliente de Autenticação - Frontend
 * 
 * Gerencia tokens (Access + Refresh) no frontend
 * - Armazena tokens de forma segura
 * - Adiciona automaticamente tokens em requisições
 * - Implementa refresh automático
 */

'use client';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

class AuthClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: Date | null = null;
  private refreshPromise: Promise<TokenPair | null> | null = null;

  constructor() {
    // Carregar tokens do sessionStorage na inicialização
    if (typeof window !== 'undefined') {
      this.loadTokens();
    }
  }

  /**
   * Carrega tokens do sessionStorage
   */
  private loadTokens(): void {
    try {
      const stored = sessionStorage.getItem('precivox_tokens');
      if (stored) {
        const tokens = JSON.parse(stored);
        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
        this.expiresAt = new Date(tokens.expiresAt);
      }
    } catch (error) {
      console.error('[AuthClient] Erro ao carregar tokens:', error);
    }
  }

  /**
   * Salva tokens no sessionStorage
   */
  private saveTokens(tokens: TokenPair): void {
    try {
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      this.expiresAt = new Date(tokens.expiresAt);
      
      sessionStorage.setItem('precivox_tokens', JSON.stringify({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      }));
    } catch (error) {
      console.error('[AuthClient] Erro ao salvar tokens:', error);
    }
  }

  /**
   * Limpa tokens
   */
  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
    sessionStorage.removeItem('precivox_tokens');
  }

  /**
   * Verifica se o access token está expirado ou próximo de expirar
   */
  private isTokenExpired(): boolean {
    if (!this.expiresAt || !this.accessToken) {
      return true;
    }
    
    // Considerar expirado se faltar menos de 1 minuto
    const now = new Date();
    const timeUntilExpiry = this.expiresAt.getTime() - now.getTime();
    return timeUntilExpiry < 60000; // 1 minuto
  }

  /**
   * Obtém access token válido (renova se necessário)
   */
  async getAccessToken(): Promise<string | null> {
    // Se não tem token, retorna null
    if (!this.accessToken) {
      return null;
    }

    // Se token está válido, retorna
    if (!this.isTokenExpired()) {
      return this.accessToken;
    }

    // Se está expirado, tenta renovar
    if (this.refreshToken) {
      const newTokens = await this.refreshAccessToken();
      return newTokens?.accessToken || null;
    }

    return null;
  }

  /**
   * Renova access token usando refresh token
   */
  async refreshAccessToken(): Promise<TokenPair | null> {
    // Evitar múltiplas chamadas simultâneas
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      return null;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            refreshToken: this.refreshToken,
          }),
        });

        if (!response.ok) {
          // Refresh token inválido, limpar tudo
          this.clearTokens();
          return null;
        }

        const data = await response.json();
        if (data.success && data.accessToken && data.refreshToken) {
          this.saveTokens({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt: data.expiresAt,
          });
          return {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt: data.expiresAt,
          };
        }

        return null;
      } catch (error) {
        console.error('[AuthClient] Erro ao renovar token:', error);
        this.clearTokens();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Emite tokens após login (chamado após NextAuth login)
   */
  async issueTokens(): Promise<TokenPair | null> {
    try {
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.success && data.accessToken && data.refreshToken) {
        this.saveTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
        });
        return {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
        };
      }

      return null;
    } catch (error) {
      console.error('[AuthClient] Erro ao emitir tokens:', error);
      return null;
    }
  }

  /**
   * Adiciona token ao header Authorization se disponível
   */
  async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.getAccessToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }
}

// Singleton
export const authClient = new AuthClient();

/**
 * Fetch autenticado - adiciona token automaticamente
 */
export async function authenticatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const headers = await authClient.getAuthHeaders();
  
  return fetch(url, {
    ...options,
    credentials: 'include', // Sempre incluir cookies (NextAuth fallback)
    headers: {
      ...headers,
      ...options?.headers,
    },
  });
}

/**
 * Hook para usar autenticação no React
 */
export function useAuth() {
  const issueTokens = async () => {
    return await authClient.issueTokens();
  };

  const logout = () => {
    authClient.clearTokens();
  };

  const getAccessToken = async () => {
    return await authClient.getAccessToken();
  };

  return {
    issueTokens,
    logout,
    getAccessToken,
  };
}
