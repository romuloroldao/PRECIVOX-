'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ProductSuggestion {
  id: string;
  name: string;
  category: string;
  marca: string;
  imagem?: string;
}

export function useProductSuggestions(searchTerm: string) {
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/products/suggestions?q=${encodeURIComponent(term)}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar sugestões');
      }

      const data = await response.json();
      setSuggestions(data.data || []);
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(searchTerm);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchSuggestions]);

  return { suggestions, loading };
}
