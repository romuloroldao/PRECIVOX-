// src/hooks/usePrecivox.ts
// Hook personalizado para usar a API PRECIVOX no React

import { useState, useEffect, useCallback, useRef } from 'react';
import precivoxAPI, { 
  BuscaParams, 
  Produto, 
  AnalyticsData,
  BuscaResponse 
} from '../services/precivoxApi';

// Types para os hooks
interface UseBuscaState {
  produtos: Produto[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
}

interface UseAnalyticsState {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// Hook principal para busca de produtos
export const useBusca = () => {
  const [state, setState] = useState<UseBuscaState>({
    produtos: [],
    loading: false,
    error: null,
    total: 0,
    hasMore: true
  });

  const [ultimaBusca, setUltimaBusca] = useState<BuscaParams>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  // Função para buscar produtos
  const buscar = useCallback(async (params: BuscaParams) => {
    // Cancelar busca anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await precivoxAPI.buscarProdutos(params);
      
      setState({
        produtos: response.data,
        loading: false,
        error: null,
        total: response.count,
        hasMore: response.data.length >= (params.limit || 20)
      });
      
      setUltimaBusca(params);
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  }, []);

  // Limpar resultados
  const limpar = useCallback(() => {
    setState({
      produtos: [],
      loading: false,
      error: null,
      total: 0,
      hasMore: true
    });
    setUltimaBusca({});
  }, []);

  // Recarregar última busca
  const recarregar = useCallback(() => {
    if (Object.keys(ultimaBusca).length > 0) {
      buscar(ultimaBusca);
    }
  }, [ultimaBusca, buscar]);

  return {
    ...state,
    buscar,
    limpar,
    recarregar,
    ultimaBusca
  };
};

// Hook para autocomplete/sugestões
export const useSugestoes = (delay: number = 300) => {
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const buscarSugestoes = useCallback((query: string) => {
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!query || query.length < 2) {
      setSugestoes([]);
      return;
    }

    setLoading(true);

    // Debounce
    timeoutRef.current = setTimeout(async () => {
      try {
        const resultados = await precivoxAPI.obterSugestoes(query);
        setSugestoes(resultados);
      } catch (error) {
        console.warn('Erro ao buscar sugestões:', error);
        setSugestoes([]);
      } finally {
        setLoading(false);
      }
    }, delay);
  }, [delay]);

  const limparSugestoes = useCallback(() => {
    setSugestoes([]);
    setLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    sugestoes,
    loading,
    buscarSugestoes,
    limparSugestoes
  };
};

// Hook para analytics
export const useAnalytics = (autoRefresh: boolean = true, interval: number = 30000) => {
  const [state, setState] = useState<UseAnalyticsState>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const intervalRef = useRef<NodeJS.Timeout>();

  const carregar = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await precivoxAPI.obterAnalytics();
      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar analytics'
      }));
    }
  }, []);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      carregar(); // Carregar imediatamente
      
      intervalRef.current = setInterval(() => {
        carregar();
      }, interval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, interval, carregar]);

  return {
    ...state,
    carregar,
    recarregar: carregar
  };
};

// Hook para verificar status da API
export const useAPIStatus = (checkInterval: number = 60000) => {
  const [status, setStatus] = useState<{
    online: boolean;
    lastCheck: string | null;
    error: string | null;
  }>({
    online: true,
    lastCheck: null,
    error: null
  });

  const verificarStatus = useCallback(async () => {
    try {
      await precivoxAPI.health();
      setStatus({
        online: true,
        lastCheck: new Date().toISOString(),
        error: null
      });
    } catch (error) {
      setStatus({
        online: false,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro de conexão'
      });
    }
  }, []);

  useEffect(() => {
    verificarStatus(); // Verificar imediatamente
    
    const interval = setInterval(verificarStatus, checkInterval);
    
    return () => clearInterval(interval);
  }, [verificarStatus, checkInterval]);

  return {
    ...status,
    verificar: verificarStatus
  };
};

// Hook para um produto específico
export const useProduto = (id: string | null) => {
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setProduto(null);
      setError(null);
      return;
    }

    const carregar = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await precivoxAPI.obterProduto(id);
        setProduto(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Erro ao carregar produto');
        setProduto(null);
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [id]);

  return { produto, loading, error };
};

// Hook para comparação de preços
export const useComparacaoPrecos = () => {
  const [state, setState] = useState<{
    data: any | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: false,
    error: null
  });

  const comparar = useCallback(async (sku: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await precivoxAPI.compararPrecos(sku);
      setState({
        data,
        loading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro na comparação'
      }));
    }
  }, []);

  return {
    ...state,
    comparar
  };
};

// Hook personalizado para localStorage
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Erro ao ler localStorage para key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Erro ao salvar no localStorage para key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Erro ao remover do localStorage para key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
};

// Export de todos os hooks
export default {
  useBusca,
  useSugestoes,
  useAnalytics,
  useAPIStatus,
  useProduto,
  useComparacaoPrecos,
  useLocalStorage
};