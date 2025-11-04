'use client';

import { useState, useEffect } from 'react';

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

export function useProdutos(params: UseProdutosParams = {}) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarProdutos = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.busca) queryParams.append('busca', params.busca);
      if (params.categoria) queryParams.append('categoria', params.categoria);
      if (params.marca) queryParams.append('marca', params.marca);
      if (params.precoMin) queryParams.append('precoMin', params.precoMin.toString());
      if (params.precoMax) queryParams.append('precoMax', params.precoMax.toString());
      if (params.disponivel !== undefined) queryParams.append('disponivel', params.disponivel.toString());
      if (params.emPromocao !== undefined) queryParams.append('emPromocao', params.emPromocao.toString());
      if (params.mercado) queryParams.append('mercado', params.mercado);
      if (params.cidade) queryParams.append('cidade', params.cidade);

      const response = await fetch(`/api/produtos/buscar?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar produtos');
      }

      const data = await response.json();
      
      // Transformar dados para incluir estoqueId no id
      const produtosFormatados = data.map((produto: any) => ({
        ...produto,
        estoqueId: produto.id,
        id: `${produto.id}-${produto.unidade.id}`, // ID único para lista
      }));

      setProdutos(produtosFormatados);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao buscar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarProdutos();
  }, [
    params.busca,
    params.categoria,
    params.marca,
    params.precoMin,
    params.precoMax,
    params.disponivel,
    params.emPromocao,
    params.mercado,
    params.cidade,
  ]);

  return {
    produtos,
    loading,
    error,
    buscarProdutos,
  };
}

