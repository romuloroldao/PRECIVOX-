// components/search/AISearchBar.tsx - BARRA DE BUSCA COM IA AVANÇADA
import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Loader2, 
  X, 
  Clock, 
  Brain, 
  Sparkles, 
  ChefHat,
  TrendingUp,
  Zap,
  Target,
  ArrowRight,
  Lightbulb
} from 'lucide-react';

import { Product } from '../../types/product';
import { useAISearch } from '../../hooks/useAISearch';
import { AISearchSuggestion } from '../../services/aiSearchService';

interface AISearchBarProps {
  products: Product[];
  onSearchResults: (results: any) => void;
  placeholder?: string;
  className?: string;
  variant?: 'default' | 'hero' | 'compact';
  showSmartFeatures?: boolean;
  enableVoiceSearch?: boolean;
  autoFocus?: boolean;
}

const AISearchBar: React.FC<AISearchBarProps> = ({
  products,
  onSearchResults,
  placeholder = "Busque com inteligência: 'ingredientes para bolo', 'promoções de carne'...",
  className = "",
  variant = 'default',
  showSmartFeatures = true,
  enableVoiceSearch = false,
  autoFocus = false
}) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showIntentHint, setShowIntentHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hook de busca IA
  const {
    query,
    isSearching,
    searchResults,
    autocompleteSuggestions,
    showAutocomplete,
    isAutoCompleteLoading,
    searchHistory,
    searchStats,
    handleQueryChange,
    handleSearch,
    handleSuggestionSelect,
    clearSearch,
    hideAutocomplete,
    showAutocompleteSuggestions,
    getRecipeSuggestions,
    getSemanticSuggestions,
    getCorrectionSuggestions
  } = useAISearch({
    products,
    enableAutoComplete: true,
    enableSemanticSearch: true,
    enableRecipeSuggestions: true,
    enableCorrections: true,
    maxSuggestions: 8,
    onSearch: (query, results) => {
      onSearchResults(results);
    }
  });

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        hideAutocomplete();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [hideAutocomplete]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  /**
   * ✅ HANDLERS DE EVENTO
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    handleQueryChange(newQuery);
    setSelectedIndex(-1);
    
    // Mostrar dica de intenção se necessário
    if (newQuery.length > 3) {
      setShowIntentHint(true);
      setTimeout(() => setShowIntentHint(false), 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleSearch();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showAutocomplete) return;

    const totalOptions = autocompleteSuggestions.length + (searchHistory.length > 0 ? searchHistory.length : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < totalOptions - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const allOptions = [
            ...searchHistory.map(h => ({ text: h, type: 'history' as const })),
            ...autocompleteSuggestions
          ];
          if (allOptions[selectedIndex]) {
            handleSuggestionSelect(allOptions[selectedIndex].text);
          }
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        hideAutocomplete();
        setSelectedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    showAutocompleteSuggestions();
  };

  /**
   * ✅ COMPONENTES DE SUGESTÃO
   */
  const getSuggestionIcon = (suggestion: AISearchSuggestion) => {
    switch (suggestion.type) {
      case 'recipe':
        return <ChefHat className="w-4 h-4 text-orange-500" />;
      case 'semantic':
        return <Brain className="w-4 h-4 text-purple-500" />;
      case 'corrected':
        return <Sparkles className="w-4 h-4 text-green-500" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSuggestionBadge = (suggestion: AISearchSuggestion) => {
    const badges = {
      'recipe': { text: 'Receita', color: 'bg-orange-100 text-orange-700' },
      'semantic': { text: 'IA', color: 'bg-purple-100 text-purple-700' },
      'corrected': { text: 'Correção', color: 'bg-green-100 text-green-700' },
      'trending': { text: 'Trending', color: 'bg-blue-100 text-blue-700' },
      'related': { text: 'Relacionado', color: 'bg-gray-100 text-gray-700' }
    };

    const badge = badges[suggestion.type];
    if (!badge) return null;

    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  /**
   * ✅ ESTILOS POR VARIANTE
   */
  const getVariantStyles = () => {
    const styles = {
      hero: {
        container: 'relative w-full max-w-4xl mx-auto',
        input: `
          w-full px-6 pl-14 pr-14 py-5 text-xl border-2 border-gray-200 rounded-2xl
          focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all
          placeholder-gray-500 bg-white shadow-lg
          disabled:bg-gray-100 disabled:cursor-not-allowed
        `,
        searchIcon: 'absolute left-5 top-1/2 transform -translate-y-1/2',
        clearButton: 'absolute right-5 top-1/2 transform -translate-y-1/2'
      },
      compact: {
        container: 'relative w-full',
        input: `
          w-full px-3 pl-10 pr-10 py-3 text-base border border-gray-300 rounded-lg
          focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
          disabled:bg-gray-100 disabled:cursor-not-allowed
        `,
        searchIcon: 'absolute left-3 top-1/2 transform -translate-y-1/2',
        clearButton: 'absolute right-3 top-1/2 transform -translate-y-1/2'
      },
      default: {
        container: 'relative w-full',
        input: `
          w-full px-4 pl-12 pr-12 py-4 text-lg border-2 border-gray-300 rounded-xl
          focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all
          disabled:bg-gray-100 disabled:cursor-not-allowed
        `,
        searchIcon: 'absolute left-4 top-1/2 transform -translate-y-1/2',
        clearButton: 'absolute right-4 top-1/2 transform -translate-y-1/2'
      }
    };

    return styles[variant];
  };

  const styles = getVariantStyles();

  return (
    <div className={`${styles.container} ${className}`} ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative">
        {/* Input Principal */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSearching}
            className={styles.input}
          />

          {/* Ícone de busca com IA */}
          <div className={styles.searchIcon}>
            {isSearching ? (
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            ) : (
              <div className="relative">
                <Search className="w-6 h-6 text-gray-400" />
                {showSmartFeatures && (
                  <Sparkles className="w-3 h-3 text-blue-500 absolute -top-1 -right-1" />
                )}
              </div>
            )}
          </div>

          {/* Botão limpar */}
          {query && !isSearching && (
            <button
              type="button"
              onClick={clearSearch}
              className={`${styles.clearButton} text-gray-400 hover:text-gray-600 transition-colors`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Dica de Intenção Inteligente */}
        {showIntentHint && showSmartFeatures && searchStats?.intent && (
          <div className="absolute top-full left-0 right-0 mt-1 z-40">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                <span className="text-blue-700">
                  {searchStats.intent.type === 'recipe' && 'Detectamos busca por receita! 👨‍🍳'}
                  {searchStats.intent.type === 'promotion' && 'Buscando promoções! 🏷️'}
                  {searchStats.intent.type === 'price' && 'Comparando preços! 💰'}
                  {searchStats.intent.type === 'category' && 'Filtrando por categoria! 📂'}
                </span>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Dropdown de Sugestões Inteligentes */}
      {showAutocomplete && (
        <div className={`
          absolute top-full ${showIntentHint ? 'mt-12' : 'mt-2'} left-0 right-0 
          bg-white border border-gray-200 rounded-xl shadow-lg z-50 
          max-h-96 overflow-hidden
        `}>
          
          {/* Loading do Autocomplete */}
          {isAutoCompleteLoading && (
            <div className="p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Brain className="w-4 h-4 animate-pulse" />
                IA processando sugestões...
              </div>
            </div>
          )}

          {/* Histórico de Buscas */}
          {searchHistory.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-3 py-2 bg-gray-50">
                <div className="flex items-center text-sm font-medium text-gray-700">
                  <Clock className="w-4 h-4 mr-2" />
                  Buscas recentes
                </div>
              </div>
              <div className="max-h-32 overflow-y-auto">
                {searchHistory.slice(0, 3).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionSelect(search)}
                    className={`
                      w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors
                      ${selectedIndex === index ? 'bg-blue-50 border-l-2 border-blue-500' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{search}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sugestões de Correção */}
          {getCorrectionSuggestions().length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-3 py-2 bg-green-50">
                <div className="flex items-center text-sm font-medium text-green-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Correção sugerida
                </div>
              </div>
              {getCorrectionSuggestions().map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full text-left px-3 py-3 hover:bg-green-50 border-l-2 border-green-400"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getSuggestionIcon(suggestion)}
                      <span className="text-gray-900 font-medium">{suggestion.text}</span>
                      {getSuggestionBadge(suggestion)}
                    </div>
                    <ArrowRight className="w-4 h-4 text-green-500" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Sugestões de Receitas */}
          {getRecipeSuggestions().length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-3 py-2 bg-orange-50">
                <div className="flex items-center text-sm font-medium text-orange-700">
                  <ChefHat className="w-4 h-4 mr-2" />
                  Receitas e ingredientes
                </div>
              </div>
              {getRecipeSuggestions().map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full text-left px-3 py-3 hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getSuggestionIcon(suggestion)}
                      <div>
                        <span className="text-gray-900">{suggestion.text}</span>
                        {suggestion.metadata?.relatedTerms && (
                          <div className="text-xs text-gray-500 mt-1">
                            {suggestion.metadata.relatedTerms.slice(0, 3).join(', ')}
                          </div>
                        )}
                      </div>
                      {getSuggestionBadge(suggestion)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Sugestões Semânticas IA */}
          {getSemanticSuggestions().length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-3 py-2 bg-purple-50">
                <div className="flex items-center text-sm font-medium text-purple-700">
                  <Brain className="w-4 h-4 mr-2" />
                  Sugestões inteligentes
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {getSemanticSuggestions().map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full text-left px-3 py-3 hover:bg-purple-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getSuggestionIcon(suggestion)}
                        <div>
                          <span className="text-gray-900">{suggestion.text}</span>
                          {suggestion.metadata?.category && (
                            <div className="text-xs text-gray-500">
                              em {suggestion.metadata.category}
                            </div>
                          )}
                        </div>
                        {getSuggestionBadge(suggestion)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {Math.round(suggestion.score * 100)}%
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Outras Sugestões */}
          {autocompleteSuggestions.filter(s => 
            !['corrected', 'recipe', 'semantic'].includes(s.type)
          ).length > 0 && (
            <div>
              <div className="px-3 py-2 bg-gray-50">
                <div className="flex items-center text-sm font-medium text-gray-700">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Outras sugestões
                </div>
              </div>
              <div className="max-h-32 overflow-y-auto">
                {autocompleteSuggestions
                  .filter(s => !['corrected', 'recipe', 'semantic'].includes(s.type))
                  .map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getSuggestionIcon(suggestion)}
                        <span className="text-gray-700">{suggestion.text}</span>
                        {getSuggestionBadge(suggestion)}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Estado vazio */}
          {!isAutoCompleteLoading && 
           autocompleteSuggestions.length === 0 && 
           searchHistory.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Digite para ver sugestões inteligentes</p>
            </div>
          )}

          {/* Footer com estatísticas */}
          {showSmartFeatures && searchStats && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span>🧠 IA ativada</span>
                  {searchStats.processingTime && (
                    <span>⚡ {searchStats.processingTime}ms</span>
                  )}
                </div>
                {enableVoiceSearch && (
                  <span className="flex items-center gap-1">
                    🎤 Voz disponível
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AISearchBar;