/**
 * Tratamento Padronizado de Erros HTTP
 * 
 * Centraliza tratamento de erros de autenticação e autorização
 */

export interface ApiError {
  message: string;
  code?: string;
  status: number;
}

/**
 * Trata resposta HTTP e retorna erro padronizado
 */
export async function handleApiError(response: Response): Promise<ApiError> {
  let errorMessage = 'Erro na requisição';
  let errorCode: string | undefined;

  try {
    const data = await response.json();
    errorMessage = data.error || data.message || errorMessage;
    errorCode = data.code;
  } catch {
    // Se não conseguir parsear JSON, usar mensagem padrão baseada no status
    switch (response.status) {
      case 401:
        errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
        errorCode = 'UNAUTHORIZED';
        break;
      case 403:
        errorMessage = 'Você não tem permissão para realizar esta ação.';
        errorCode = 'FORBIDDEN';
        break;
      case 404:
        errorMessage = 'Recurso não encontrado.';
        errorCode = 'NOT_FOUND';
        break;
      case 500:
        errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
        errorCode = 'INTERNAL_ERROR';
        break;
      default:
        errorMessage = `Erro ${response.status}`;
    }
  }

  return {
    message: errorMessage,
    code: errorCode,
    status: response.status,
  };
}

/**
 * Verifica se erro é de autenticação (401)
 */
export function isUnauthorizedError(error: ApiError): boolean {
  return error.status === 401;
}

/**
 * Verifica se erro é de autorização (403)
 */
export function isForbiddenError(error: ApiError): boolean {
  return error.status === 403;
}

/**
 * Redireciona para login se erro for 401
 */
export function redirectToLoginIfUnauthorized(error: ApiError): void {
  if (isUnauthorizedError(error) && typeof window !== 'undefined') {
    // Limpar tokens
    import('@/lib/auth-client').then(({ authClient }) => {
      authClient.clearTokens();
    });
    
    // Redirecionar para login
    window.location.href = '/login';
  }
}

