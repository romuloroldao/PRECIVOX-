/**
 * Hook para requisições POST/PUT/DELETE (mutations)
 * Gerencia loading, error e success automaticamente
 * 
 * Arquitetura: UI → Hook → API Client → Backend
 */

import { useState, useCallback } from 'react';
import { apiFetch, ApiResult } from '@/lib/api-client';

export interface UseApiMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface UseApiMutationResult<TData, TVariables> {
  mutate: (variables: TVariables, options?: { method?: string; url?: string }) => void;
  mutateAsync: (variables: TVariables, options?: { method?: string; url?: string }) => Promise<ApiResult<TData>>;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: string | null;
  data: TData | null;
  reset: () => void;
}

/**
 * Hook para fazer mutations (POST/PUT/DELETE) com gerenciamento automático de estado
 * 
 * @example
 * const { mutate, isLoading, error } = useApiMutation<User, CreateUserData>(
 *   '/api/admin/users',
 *   { method: 'POST' }
 * );
 * 
 * mutate({ nome: 'João', email: 'joao@example.com' });
 */
export function useApiMutation<TData = any, TVariables = any>(
  url: string,
  options: UseApiMutationOptions<TData, TVariables> & { method?: string } = {}
): UseApiMutationResult<TData, TVariables> {
  const {
    method = 'POST',
    onSuccess,
    onError,
    retries = 2,
    retryDelay = 1000,
    timeout = 30000,
  } = options;

  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const mutateAsync = useCallback(
    async (
      variables: TVariables,
      mutationOptions?: { method?: string; url?: string }
    ): Promise<ApiResult<TData>> => {
      const finalUrl = mutationOptions?.url || url;
      const finalMethod = mutationOptions?.method || method;

      setIsLoading(true);
      setIsError(false);
      setIsSuccess(false);
      setError(null);
      setData(null);

      try {
        const result = await apiFetch<TData>(finalUrl, {
          method: finalMethod,
          body: JSON.stringify(variables),
          retries,
          retryDelay,
          timeout,
          onError: (apiError) => {
            const errorMessage = apiError.message || 'Erro desconhecido';
            setError(errorMessage);
            setIsError(true);
            
            if (onError) {
              onError(new Error(errorMessage));
            }
          },
        });

        if (result.success && result.data !== null) {
          setData(result.data);
          setIsSuccess(true);
          setIsError(false);
          setError(null);
          
          if (onSuccess) {
            onSuccess(result.data);
          }
        } else if (result.error) {
          const errorMessage = result.error.message || 'Erro ao executar operação';
          setError(errorMessage);
          setIsError(true);
          
          if (onError) {
            onError(new Error(errorMessage));
          }
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        setIsError(true);
        
        const errorResult: ApiResult<TData> = {
          data: null,
          error: {
            message: errorMessage,
            status: 0,
            retryable: false,
          },
          success: false,
        };

        if (onError) {
          onError(err instanceof Error ? err : new Error(errorMessage));
        }

        return errorResult;
      } finally {
        setIsLoading(false);
      }
    },
    [url, method, retries, retryDelay, timeout, onSuccess, onError]
  );

  const mutate = useCallback(
    (
      variables: TVariables,
      mutationOptions?: { method?: string; url?: string }
    ) => {
      mutateAsync(variables, mutationOptions).catch(() => {
        // Erro já tratado no mutateAsync
      });
    },
    [mutateAsync]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setIsError(false);
    setIsSuccess(false);
  }, []);

  return {
    mutate,
    mutateAsync,
    isLoading,
    isError,
    isSuccess,
    error,
    data,
    reset,
  };
}

