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
}

// Hook para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
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
  const [error, setError] = useState<string | null>(null);

  // Debounce na busca (400ms)
  const buscaDebounced = useDebounce(params.busca, 400);

  const buscarProdutos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (buscaDebounced) queryParams.append('busca', buscaDebounced);
      if (params.categoria) queryParams.append('categoria', params.categoria);
      if (params.marca) queryParams.append('marca', params.marca);
      if (params.precoMin) queryParams.append('precoMin', params.precoMin.toString());
      if (params.precoMax) queryParams.append('precoMax', params.precoMax.toString());
      if (params.disponivel !== undefined) queryParams.append('disponivel', params.disponivel.toString());
      if (params.emPromocao !== undefined) queryParams.append('emPromocao', params.emPromocao.toString());
      if (params.mercado) queryParams.append('mercado', params.mercado);
      if (params.cidade) queryParams.append('cidade', params.cidade);

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

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Resposta da API em formato inválido');
      }
      
      // Transformar dados para incluir estoqueId no id
      // Os dados vêm do backend com estrutura: { id, produtos, unidades: { mercados } }
      const produtosFormatados = data.map((estoque: any) => ({
        id: `${estoque.id}-${estoque.unidades?.id || estoque.unidade?.id || ''}`,
        estoqueId: estoque.id,
        nome: estoque.produtos?.nome || estoque.produto?.nome || '',
        preco: Number(estoque.preco) || 0,
        precoPromocional: estoque.precoPromocional ? Number(estoque.precoPromocional) : undefined,
        emPromocao: estoque.emPromocao || false,
        disponivel: estoque.disponivel !== false,
        quantidade: estoque.quantidade || 0,
        categoria: estoque.produtos?.categoria || estoque.produto?.categoria || '',
        marca: estoque.produtos?.marca || estoque.produto?.marca || '',
        imagem: estoque.produtos?.imagem || estoque.produto?.imagem || '',
        unidade: {
          id: estoque.unidades?.id || estoque.unidade?.id || '',
          nome: estoque.unidades?.nome || estoque.unidade?.nome || '',
          endereco: estoque.unidades?.endereco || estoque.unidade?.endereco || '',
          cidade: estoque.unidades?.cidade || estoque.unidade?.cidade || '',
          estado: estoque.unidades?.estado || estoque.unidade?.estado || '',
          mercado: {
            id: estoque.unidades?.mercados?.id || estoque.unidade?.mercado?.id || '',
            nome: estoque.unidades?.mercados?.nome || estoque.unidade?.mercado?.nome || '',
          },
        },
        produto: estoque.produtos || estoque.produto,
      }));

      setProdutos(produtosFormatados);
      setError(null); // Limpa erro em caso de sucesso
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar produtos';
      setError(errorMessage);
      setProdutos([]); // Define array vazio em caso de erro
      console.error('Erro ao buscar produtos:', err);
    } finally {
      setLoading(false);
    }
  }, [
    buscaDebounced,
    params.categoria,
    params.marca,
    params.precoMin,
    params.precoMax,
    params.disponivel,
    params.emPromocao,
    params.mercado,
    params.cidade,
  ]);

  useEffect(() => {
    buscarProdutos();
  }, [buscarProdutos]);

  // Revalidação automática a cada 30 segundos quando não há busca ativa
  useEffect(() => {
    if (!buscaDebounced && !loading) {
      const interval = setInterval(() => {
        buscarProdutos();
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [buscaDebounced, loading, buscarProdutos]);

  return {
    produtos,
    loading,
    error,
    buscarProdutos,
  };
}

