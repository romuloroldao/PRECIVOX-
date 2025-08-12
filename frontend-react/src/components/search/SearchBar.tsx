// SearchBar.tsx - VERSÃO OTIMIZADA PARA HOMEPAGE E SEARCHPAGE
import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, X, Clock, TrendingUp, Sparkles } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange?: (query: string) => void;
  onSearch: (query: string) => void;
  loading?: boolean;
  suggestions?: string[];
  recentSearches?: string[];
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  showHistory?: boolean;
  onClear?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'hero' | 'compact'; // ✅ NOVO: Variantes para diferentes contextos
  showSmartLabel?: boolean; // ✅ NOVO: Mostrar label de busca inteligente
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  loading = false,
  suggestions = [],
  recentSearches = [],
  placeholder = "Digite o produto que você procura...",
  className = "",
  autoFocus = false,
  showHistory = true,
  onClear,
  disabled = false,
  variant = 'default',
  showSmartLabel = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Atualizar valor interno quando prop value mudar
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ SUGESTÕES INTELIGENTES - Filtragem melhorada
  const filteredSuggestions = React.useMemo(() => {
    if (!inputValue.trim()) {
      // Mostrar sugestões populares quando não há input
      return suggestions.slice(0, 8);
    }
    
    return suggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) && 
      suggestion.toLowerCase() !== inputValue.toLowerCase()
    ).slice(0, 8);
  }, [suggestions, inputValue]);

  // Filtrar pesquisas recentes
  const filteredRecentSearches = React.useMemo(() => {
    if (!showHistory) return [];
    
    return recentSearches.filter(search =>
      search.toLowerCase().includes(inputValue.toLowerCase()) && 
      search.toLowerCase() !== inputValue.toLowerCase()
    ).slice(0, 5);
  }, [recentSearches, inputValue, showHistory]);

  // Todas as opções do dropdown
  const allOptions = [
    ...filteredRecentSearches.map(search => ({ type: 'recent', value: search })),
    ...filteredSuggestions.map(suggestion => ({ type: 'suggestion', value: suggestion }))
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Chamar onChange se foi fornecido
    if (onChange) {
      onChange(newValue);
    }
    
    // Abrir dropdown se há valor ou histórico
    const shouldOpen = newValue.length > 0 || (showHistory && recentSearches.length > 0);
    setIsOpen(shouldOpen);
    setSelectedIndex(-1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !loading) {
      console.log('🔍 SEARCHBAR - Submetendo busca:', inputValue.trim());
      onSearch(inputValue.trim());
      setIsOpen(false);
    }
  };

  const handleOptionClick = (option: string) => {
    console.log('👆 SEARCHBAR - Opção clicada:', option);
    setInputValue(option);
    onSearch(option);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allOptions[selectedIndex]) {
          handleOptionClick(allOptions[selectedIndex].value);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleClear = () => {
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
    if (onClear) onClear();
  };

  const handleFocus = () => {
    const shouldOpen = inputValue.length > 0 || (showHistory && recentSearches.length > 0);
    setIsOpen(shouldOpen);
  };

  // ✅ ESTILOS BASEADOS NA VARIANTE
  const getVariantStyles = () => {
    switch (variant) {
      case 'hero':
        return {
          container: 'relative',
          input: `
            w-full px-6 pl-14 pr-14 py-5 text-xl border-2 border-gray-200 rounded-2xl
            focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all
            placeholder-gray-500 bg-white shadow-lg
            disabled:bg-gray-100 disabled:cursor-not-allowed
          `,
          searchIcon: 'absolute left-5 top-1/2 transform -translate-y-1/2',
          clearButton: 'absolute right-5 top-1/2 transform -translate-y-1/2',
          submitButton: 'hidden' // Hero variant não precisa de botão submit separado
        };
      case 'compact':
        return {
          container: 'relative',
          input: `
            w-full px-3 pl-10 pr-10 py-3 text-base border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-[#004A7C]/20 focus:border-[#004A7C] transition-all
            disabled:bg-gray-100 disabled:cursor-not-allowed
          `,
          searchIcon: 'absolute left-3 top-1/2 transform -translate-y-1/2',
          clearButton: 'absolute right-3 top-1/2 transform -translate-y-1/2',
          submitButton: 'hidden'
        };
      default:
        return {
          container: 'relative',
          input: `
            w-full px-4 pl-12 pr-12 py-4 text-lg border-2 border-gray-300 rounded-xl
            focus:ring-4 focus:ring-[#004A7C]/20 focus:border-[#004A7C] transition-all
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${loading ? 'pr-16' : ''}
          `,
          searchIcon: 'absolute left-4 top-1/2 transform -translate-y-1/2',
          clearButton: 'absolute right-4 top-1/2 transform -translate-y-1/2',
          submitButton: `
            hidden sm:block absolute right-2 top-2 bottom-2 px-6 bg-[#004A7C] 
            text-white rounded-lg hover:bg-[#0066A3] transition-colors 
            disabled:opacity-50 disabled:cursor-not-allowed font-medium
          `
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`${styles.container} ${className}`} ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || loading}
            autoFocus={autoFocus}
            className={styles.input}
          />

          {/* Ícone de busca */}
          <div className={styles.searchIcon}>
            {loading ? (
              <Loader2 className="w-6 h-6 text-[#004A7C] animate-spin" />
            ) : (
              <Search className="w-6 h-6 text-gray-400" />
            )}
          </div>

          {/* Botão limpar */}
          {inputValue && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className={`${styles.clearButton} text-gray-400 hover:text-gray-600 transition-colors`}
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Loading spinner adicional */}
          {loading && variant !== 'hero' && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <Loader2 className="w-5 h-5 text-[#004A7C] animate-spin" />
            </div>
          )}
        </div>

        {/* Botão submit (apenas para variant default) */}
        {variant === 'default' && (
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className={styles.submitButton}
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        )}
      </form>

      {/* ✅ LABEL DE BUSCA INTELIGENTE */}
      {showSmartLabel && inputValue.trim() && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-40">
          <div className="text-xs text-gray-500 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span>Busca inteligente: encontrando variações e sinônimos para "{inputValue}"</span>
          </div>
        </div>
      )}

      {/* Dropdown de sugestões */}
      {isOpen && (allOptions.length > 0 || (showHistory && recentSearches.length > 0)) && (
        <div className={`
          absolute ${showSmartLabel && inputValue.trim() && filteredSuggestions.length > 0 ? 'top-full mt-12' : 'top-full mt-2'} 
          left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto
        `}>
          
          {/* Pesquisas recentes */}
          {showHistory && filteredRecentSearches.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                <Clock className="w-4 h-4" />
                Pesquisas recentes
              </div>
              {filteredRecentSearches.map((search, index) => (
                <button
                  key={`recent-${search}`}
                  onClick={() => handleOptionClick(search)}
                  className={`
                    w-full text-left px-3 py-2 text-sm rounded-lg transition-colors
                    ${selectedIndex === index 
                      ? 'bg-[#004A7C] text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 opacity-50" />
                    <span>{search}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Sugestões inteligentes */}
          {filteredSuggestions.length > 0 && (
            <div className="p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Sugestões inteligentes
              </div>
              {filteredSuggestions.map((suggestion, index) => {
                const globalIndex = filteredRecentSearches.length + index;
                return (
                  <button
                    key={`suggestion-${suggestion}`}
                    onClick={() => handleOptionClick(suggestion)}
                    className={`
                      w-full text-left px-3 py-2 text-sm rounded-lg transition-colors
                      ${selectedIndex === globalIndex 
                        ? 'bg-emerald-500 text-white' 
                        : 'text-gray-700 hover:bg-emerald-50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Search className="w-4 h-4 opacity-50" />
                      <span>{suggestion}</span>
                      {selectedIndex === globalIndex && (
                        <Sparkles className="w-3 h-3 ml-auto" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Estado vazio quando pesquisando */}
          {inputValue.length > 0 && allOptions.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma sugestão encontrada</p>
              <p className="text-xs">Pressione Enter para buscar "{inputValue}"</p>
            </div>
          )}

          {/* Estado inicial quando não há input */}
          {!inputValue.trim() && showHistory && recentSearches.length === 0 && filteredSuggestions.length > 0 && (
            <div className="p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                <TrendingUp className="w-4 h-4" />
                Buscas populares
              </div>
              {filteredSuggestions.slice(0, 6).map((suggestion, index) => (
                <button
                  key={`popular-${suggestion}`}
                  onClick={() => handleOptionClick(suggestion)}
                  className={`
                    w-full text-left px-3 py-2 text-sm rounded-lg transition-colors
                    ${selectedIndex === index 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-700 hover:bg-blue-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 opacity-50" />
                    <span>{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;