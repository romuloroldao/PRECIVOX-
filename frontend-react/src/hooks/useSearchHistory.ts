// ====================================
// 2. useSearchHistory - Gerencia histórico de buscas
// ====================================

import { useState, useEffect, useCallback } from 'react';

export const useSearchHistory = (maxHistory: number = 10) => {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Carregar histórico do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('precivox_search_history');
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Erro ao carregar histórico de busca:', error);
    }
  }, []);

  // Adicionar ao histórico
  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item !== query);
      const newHistory = [query, ...filtered].slice(0, maxHistory);
      
      try {
        localStorage.setItem('precivox_search_history', JSON.stringify(newHistory));
      } catch (error) {
        console.warn('Erro ao salvar histórico:', error);
      }
      
      return newHistory;
    });
  }, [maxHistory]);

  // Limpar histórico
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('precivox_search_history');
    } catch (error) {
      console.warn('Erro ao limpar histórico:', error);
    }
  }, []);

  // Remover item específico
  const removeFromHistory = useCallback((query: string) => {
    setSearchHistory(prev => {
      const newHistory = prev.filter(item => item !== query);
      try {
        localStorage.setItem('precivox_search_history', JSON.stringify(newHistory));
      } catch (error) {
        console.warn('Erro ao salvar histórico:', error);
      }
      return newHistory;
    });
  }, []);

  // Obter pesquisas recentes limitadas
  const getRecentSearches = useCallback((limit?: number) => {
    return limit ? searchHistory.slice(0, limit) : searchHistory;
  }, [searchHistory]);

  return {
    searchHistory,
    addToHistory,
    clearHistory,
    removeFromHistory,
    getRecentSearches
  };
};