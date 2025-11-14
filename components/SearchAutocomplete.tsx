'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useProductSuggestions } from '@/app/hooks/useProductSuggestions';
import debounce from 'lodash.debounce';

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSuggestionSelect?: (suggestion: { id: string; name: string }) => void;
}

export function SearchAutocomplete({
  value,
  onChange,
  placeholder = 'Digite o nome do produto, marca ou código de barras...',
  onSuggestionSelect,
}: SearchAutocompleteProps) {
  const [internalValue, setInternalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedOnChange = useMemo(
    () =>
      debounce((term: string) => {
        onChange(term);
      }, 600),
    [onChange]
  );

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  const { suggestions, loading } = useProductSuggestions(internalValue);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setInternalValue(nextValue);
    setShowSuggestions(true);
    debouncedOnChange(nextValue);
  };

  const handleSuggestionClick = (suggestion: { id: string; name: string }) => {
    debouncedOnChange.cancel();
    setInternalValue(suggestion.name);
    onChange(suggestion.name);
    setShowSuggestions(false);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
    inputRef.current?.blur();
  };

  const handleClear = () => {
    debouncedOnChange.cancel();
    setInternalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (isFocused && inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [isFocused, internalValue]);

  const shouldShowSuggestions =
    showSuggestions && isFocused && internalValue.length >= 2 && suggestions.length > 0;

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="search"
          value={internalValue}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            if (internalValue.length >= 2) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            setTimeout(() => {
              const active = document.activeElement;
              if (active && wrapperRef.current?.contains(active)) {
                return;
              }
              setIsFocused(false);
              setShowSuggestions(false);
            }, 150);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:border-precivox-blue focus:outline-none transition-colors"
        />
        {internalValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dropdown de sugestões */}
      {shouldShowSuggestions && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-precivox-blue mx-auto"></div>
            </div>
          ) : (
            <ul className="py-2">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    {suggestion.imagem && (
                      <img
                        src={suggestion.imagem}
                        alt={suggestion.name}
                        className="w-10 h-10 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {suggestion.name}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {suggestion.marca && <span>{suggestion.marca}</span>}
                        {suggestion.marca && suggestion.category && <span> • </span>}
                        {suggestion.category && <span>{suggestion.category}</span>}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
