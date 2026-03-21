'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Produto {
  id: string;
  estoqueId: string;
  nome: string;
  preco: number;
  precoPromocional?: number;
  emPromocao: boolean;
  disponivel: boolean;
  quantidade: number;
  categoria?: string;
  marca?: string;
  imagem?: string;
  unidade: {
    id: string;
    nome: string;
    endereco: string;
    cidade: string;
    estado: string;
    mercado: {
      id: string;
      nome: string;
    };
  };
  produto?: any;
}

interface UseProdutosParams {
  busca?: string;
  categoria?: string;
  marca?: string;
  precoMin?: number;
  precoMax?: number;
  disponivel?: boolean;
  emPromocao?: boolean;
  mercado?: string;
  cidade?: string;
  debounceDelay?: number;
  initialLimit?: number;
}

// Hook para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    if (delay <= 0) {
      setDebouncedValue(value);
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useProdutos(params: UseProdutosParams = {}) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const {
    busca,
    categoria,
    marca,
    precoMin,
    precoMax,
    disponivel,
    emPromocao,
    mercado,
    cidade,
    debounceDelay = 400,
    initialLimit = 100,
  } = params;

  // Debounce na busca
  const buscaDebounced = useDebounce(busca, debounceDelay);

  const buscarProdutos = useCallback(async (targetPage = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const queryParams = new URLSearchParams();
      if (buscaDebounced) queryParams.append('busca', buscaDebounced);
      if (categoria) queryParams.append('categoria', categoria);
      if (marca) queryParams.append('marca', marca);
      if (precoMin) queryParams.append('precoMin', precoMin.toString());
      if (precoMax) queryParams.append('precoMax', precoMax.toString());
      if (disponivel !== undefined) queryParams.append('disponivel', disponivel.toString());
      if (emPromocao !== undefined) queryParams.append('emPromocao', emPromocao.toString());
      if (mercado) queryParams.append('mercado', mercado);
      if (cidade) queryParams.append('cidade', cidade);
      queryParams.append('page', targetPage.toString());
      queryParams.append('limit', initialLimit.toString());

      // Adicionar timestamp para evitar cache
      queryParams.append('_t', Date.now().toString());

      const response = await fetch(`/api/produtos/buscar?${queryParams.toString()}`, {
        cache: 'no-store',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          // Se não conseguir parsear, usa o texto original
        }
        throw new Error(errorMessage);
      }

      const payload = await response.json();
      const itemsRaw = Array.isArray(payload) ? payload : (payload?.data || []);
      if (!Array.isArray(itemsRaw)) {
        throw new Error('Resposta da API em formato inválido');
      }

      const produtosFormatados = itemsRaw.map((item: any) => ({
        id: `${item.id}-${item.unidade?.id || ''}`,
        estoqueId: item.id,
        nome: item.nome || item.produto?.nome || '',
        preco: Number(item.preco) || 0,
        precoPromocional: item.precoPromocional ? Number(item.precoPromocional) : undefined,
        emPromocao: item.emPromocao || false,
        disponivel: item.disponivel !== false,
        quantidade: item.quantidade || 0,
        categoria: item.categoria || item.produto?.categoria || '',
        marca: item.marca || item.produto?.marca || '',
        imagem: item.imagem || item.produto?.imagem || '',
        unidade: {
          id: item.unidade?.id || '',
          nome: item.unidade?.nome || '',
          endereco: item.unidade?.endereco || '',
          cidade: item.unidade?.cidade || '',
          estado: item.unidade?.estado || '',
          mercado: {
            id: item.unidade?.mercado?.id || '',
            nome: item.unidade?.mercado?.nome || '',
          },
        },
        produto: item.produto,
      }));

      setProdutos((prev) => {
        if (!append) return produtosFormatados;
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const p of produtosFormatados) {
          if (!seen.has(p.id)) merged.push(p);
        }
        return merged;
      });
      setPage(targetPage);
      const hasMoreFromApi = Boolean(payload?.pagination?.hasMore);
      setHasMore(hasMoreFromApi);
      setTotal(Number(payload?.pagination?.total || produtosFormatados.length));
      setError(null); // Limpa erro em caso de sucesso
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar produtos';
      setError(errorMessage);
      if (!append) setProdutos([]);
      console.error('Erro ao buscar produtos:', err);
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [
    buscaDebounced,
    categoria,
    marca,
    precoMin,
    precoMax,
    disponivel,
    emPromocao,
    mercado,
    cidade,
    initialLimit,
  ]);

  useEffect(() => {
    buscarProdutos(1, false);
  }, [buscarProdutos]);

  // Revalidação automática a cada 30 segundos quando não há busca ativa
  useEffect(() => {
    if (!buscaDebounced && !loading) {
      const interval = setInterval(() => {
        buscarProdutos(1, false);
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [buscaDebounced, loading, buscarProdutos]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    await buscarProdutos(page + 1, true);
  }, [buscarProdutos, hasMore, loading, loadingMore, page]);

  return {
    produtos,
    loading,
    loadingMore,
    error,
    total,
    hasMore,
    loadMore,
    buscarProdutos: () => buscarProdutos(1, false),
  };
}

