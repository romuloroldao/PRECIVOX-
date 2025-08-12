// hooks/useAISearch.ts - HOOK PARA BUSCA AVANÇADA COM IA
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Product } from '../types/product';
import { aiSearchService, AISearchResult, AISearchSuggestion } from '../services/aiSearchService';
import { useDebounce } from './useDebounce';
import { useToast } from './useToast';

interface UseAISearchOptions {
  products: Product[];
  enableAutoComplete?: boolean;
  enableSemanticSearch?: boolean;
  enableRecipeSuggestions?: boolean;
  enableCorrections?: boolean;
  autoCompleteDelay?: number;
  maxSuggestions?: number;
  onSearch?: (query: string, results: AISearchResult) => void;
}

export const useAISearch = (options: UseAISearchOptions) => {
  const {
    products,
    enableAutoComplete = true,
    enableSemanticSearch = true,
    enableRecipeSuggestions = true,
    enableCorrections = true,
    autoCompleteDelay = 300,
    maxSuggestions = 10,
    onSearch
  } = options;

  // Estados da busca
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AISearchResult | null>(null);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<AISearchSuggestion[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isAutoCompleteLoading, setIsAutoCompleteLoading] = useState(false);

  const { showInfo, showWarning } = useToast();
  
  // Debounce para autocomplete
  const debouncedQuery = useDebounce(query, autoCompleteDelay);

  /**
   * ✅ REALIZAR BUSCA PRINCIPAL COM IA
   */
  const performAISearch = useCallback(async (searchQuery: string): Promise<AISearchResult | null> => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return null;
    }

    setIsSearching(true);
    console.log('🔍 Iniciando busca com IA para:', searchQuery);

    try {
      const results = await aiSearchService.performAISearch(
        searchQuery,
        products,
        {
          includeSemanticSearch: enableSemanticSearch,
          includeRecipeSuggestions: enableRecipeSuggestions,
          includeCorrections: enableCorrections,
          maxSuggestions
        }
      );

      setSearchResults(results);
      
      // Adicionar ao histórico
      setSearchHistory(prev => {
        const filtered = prev.filter(item => item !== searchQuery);
        return [searchQuery, ...filtered].slice(0, 10);
      });

      // Callback opcional
      if (onSearch) {
        onSearch(searchQuery, results);
      }

      // Mostrar informações sobre a busca
      if (results.corrections && results.corrections.length > 0) {
        showInfo(`Busca corrigida para: "${results.corrections[0]}"`);
      }

      if (results.intent.confidence > 0.8) {
        const intentMessages = {
          'recipe': '👨‍🍳 Detectamos busca por receita!',
          'promotion': '🏷️ Buscando promoções...',
          'price': '💰 Busca por preços...',
          'comparison': '⚖️ Modo comparação ativado',
          'category': '📂 Buscando por categoria',
          'brand': '🏷️ Filtrando por marca'
        };
        
        const message = intentMessages[results.intent.type];
        if (message) {
          showInfo(message);
        }
      }

      console.log('✅ Busca IA concluída:', {
        produtos: results.products.length,
        sugestoes: results.suggestions.length,
        intencao: results.intent.type,
        tempo: `${results.processingTime}ms`
      });

      return results;
    } catch (error) {
      console.error('❌ Erro na busca IA:', error);
      showWarning('Erro na busca inteligente. Tentando busca padrão...');
      setSearchResults(null);
      return null;
    } finally {
      setIsSearching(false);
    }
  }, [
    products, 
    enableSemanticSearch, 
    enableRecipeSuggestions, 
    enableCorrections, 
    maxSuggestions,
    onSearch,
    showInfo,
    showWarning
  ]);

  /**
   * ✅ OBTER SUGESTÕES DE AUTOCOMPLETE
   */
  const getAutocompleteSuggestions = useCallback(async (searchQuery: string) => {
    if (!enableAutoComplete || !searchQuery.trim() || searchQuery.length < 2) {
      setAutocompleteSuggestions([]);
      return;
    }

    setIsAutoCompleteLoading(true);
    
    try {
      const suggestions = await aiSearchService.getSmartAutocomplete(
        searchQuery,
        products,
        maxSuggestions
      );

      setAutocompleteSuggestions(suggestions);
      console.log('💡 Autocomplete sugestões:', suggestions.length);
    } catch (error) {
      console.error('❌ Erro no autocomplete:', error);
      setAutocompleteSuggestions([]);
    } finally {
      setIsAutoCompleteLoading(false);
    }
  }, [enableAutoComplete, products, maxSuggestions]);

  /**
   * ✅ EFFECT PARA AUTOCOMPLETE
   */
  useEffect(() => {
    if (debouncedQuery !== query) return; // Aguardar debounce
    
    getAutocompleteSuggestions(debouncedQuery);
  }, [debouncedQuery, getAutocompleteSuggestions, query]);

  /**
   * ✅ HANDLERS
   */
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    
    // Mostrar autocomplete se há conteúdo
    if (newQuery.trim().length > 0) {
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
      setAutocompleteSuggestions([]);
    }
  }, []);

  const handleSearch = useCallback((searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    setShowAutocomplete(false);
    return performAISearch(finalQuery);
  }, [query, performAISearch]);

  const handleSuggestionSelect = useCallback((suggestion: AISearchSuggestion | string) => {
    const selectedText = typeof suggestion === 'string' ? suggestion : suggestion.text;
    setQuery(selectedText);
    setShowAutocomplete(false);
    return performAISearch(selectedText);
  }, [performAISearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setSearchResults(null);
    setAutocompleteSuggestions([]);
    setShowAutocomplete(false);
  }, []);

  const hideAutocomplete = useCallback(() => {
    setShowAutocomplete(false);
  }, []);

  const showAutocompleteSuggestions = useCallback(() => {
    if (query.trim().length > 0 || searchHistory.length > 0) {
      setShowAutocomplete(true);
    }
  }, [query, searchHistory]);

  /**
   * ✅ VALORES COMPUTADOS
   */
  const hasResults = useMemo(() => {
    return searchResults && searchResults.products.length > 0;
  }, [searchResults]);

  const hasCorrections = useMemo(() => {
    return searchResults?.corrections && searchResults.corrections.length > 0;
  }, [searchResults]);

  const searchStats = useMemo(() => {
    if (!searchResults) return null;
    
    return {
      totalResults: searchResults.products.length,
      processingTime: searchResults.processingTime,
      intent: searchResults.intent,
      hasSemanticMatches: searchResults.semanticMatches.length > 1,
      suggestionsCount: searchResults.suggestions.length
    };
  }, [searchResults]);

  const searchSuggestions = useMemo(() => {
    return searchResults?.suggestions || [];
  }, [searchResults]);

  const relatedQueries = useMemo(() => {
    return searchResults?.relatedQueries || [];
  }, [searchResults]);

  /**
   * ✅ FUNCIONALIDADES AVANÇADAS
   */
  const getSearchByIntent = useCallback((intentType: string) => {
    if (!searchResults) return [];
    
    return searchResults.suggestions.filter(s => s.intent?.type === intentType);
  }, [searchResults]);

  const getRecipeSuggestions = useCallback(() => {
    return searchSuggestions.filter(s => s.type === 'recipe');
  }, [searchSuggestions]);

  const getSemanticSuggestions = useCallback(() => {
    return searchSuggestions.filter(s => s.type === 'semantic');
  }, [searchSuggestions]);

  const getCorrectionSuggestions = useCallback(() => {
    return searchSuggestions.filter(s => s.type === 'corrected');
  }, [searchSuggestions]);

  // ✅ RETURN DO HOOK
  return {
    // Estados da busca
    query,
    isSearching,
    searchResults,
    hasResults,
    hasCorrections,
    
    // Autocomplete
    autocompleteSuggestions,
    showAutocomplete,
    isAutoCompleteLoading,
    
    // Histórico e estatísticas
    searchHistory,
    searchStats,
    
    // Sugestões categorizadas
    searchSuggestions,
    relatedQueries,
    
    // Handlers principais
    handleQueryChange,
    handleSearch,
    handleSuggestionSelect,
    clearSearch,
    
    // Controle de autocomplete
    hideAutocomplete,
    showAutocompleteSuggestions,
    
    // Funcionalidades avançadas
    getSearchByIntent,
    getRecipeSuggestions,
    getSemanticSuggestions,
    getCorrectionSuggestions,
    
    // Função direta do serviço
    performAISearch
  };
};