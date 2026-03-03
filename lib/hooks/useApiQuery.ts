/**
 * Hook para requisições GET (queries)
 * Gerencia loading, error, data e retry automaticamente
 * 
 * Arquitetura: UI → Hook → API Client → Backend
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api-client';

export interface UseApiQueryOptions<T> {
  enabled?: boolean;
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  refetchInterval?: number;
   skipInterceptors?: boolean;
}

export interface UseApiQueryResult<T> {
  data: T | null;
  error: string | null;
  errorStatus: number | null;
  errorCode: string | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook para fazer queries GET com gerenciamento automático de estado
 * 
 * @example
 * const { data, isLoading, error, refetch } = useApiQuery<User[]>('/api/admin/users');
 */
export function useApiQuery<T = any>(
  url: string,
  options: UseApiQueryOptions<T> = {}
): UseApiQueryResult<T> {
  const {
    enabled = true,
    retries = 2,
    retryDelay = 1000,
    timeout = 30000,
    skipInterceptors = false,
    onSuccess,
    onError,
    refetchInterval,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Criar novo AbortController
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setIsError(false);
    setIsSuccess(false);
    setError(null);
    setErrorStatus(null);
    setErrorCode(null);

    try {
      const result = await apiFetch<T>(url, {
        retries,
        retryDelay,
        timeout,
        skipInterceptors,
        signal: abortControllerRef.current.signal,
        onError: (apiError) => {
          const errorMessage = apiError.message || 'Erro desconhecido';
          setError(errorMessage);
          setErrorStatus(apiError.status);
          setErrorCode(apiError.code || null);
          setIsError(true);
          setIsLoading(false);
          
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
        setErrorStatus(null);
        setErrorCode(null);
        
        if (onSuccess) {
          onSuccess(result.data);
        }
      } else if (result.error) {
        const errorMessage = result.error.message || 'Erro ao carregar dados';
        setError(errorMessage);
        setErrorStatus(result.error.status);
        setErrorCode(result.error.code || null);
        setIsError(true);
        
        if (onError) {
          onError(new Error(errorMessage));
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setErrorStatus(null);
      setErrorCode(null);
      setIsError(true);
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      setIsLoading(false);
    }
  }, [url, retries, retryDelay, timeout, onSuccess, onError]);

  // Refetch function
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Effect para fetch inicial
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    fetchData();

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, fetchData]);

  // Effect para refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        fetchData();
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, fetchData]);

  return {
    data,
    error,
    errorStatus,
    errorCode,
    isLoading,
    isError,
    isSuccess,
    refetch,
  };
}

