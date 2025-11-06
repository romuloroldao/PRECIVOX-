'use client';

import { useState, useEffect } from 'react';

export interface Categoria {
  nome: string;
  count: number;
}

export function useCategories() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/products/categories', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar categorias');
        }

        const data = await response.json();
        setCategorias(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        console.error('Erro ao buscar categorias:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();

    // Revalidar categorias a cada 60 segundos
    const interval = setInterval(fetchCategories, 60000);

    return () => clearInterval(interval);
  }, []);

  return { categorias, loading, error };
}
