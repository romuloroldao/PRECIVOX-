// src/components/search/SearchEmptyStates.tsx - Estados Vazios da Busca
import React from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

interface SearchEmptyStatesProps {
  // Tipo de estado vazio
  type: 'initial' | 'no-results' | 'api-offline';
  
  // Dados da busca
  searchQuery?: string;
  selectedCategory?: string;
  categoryLabel?: string;
  
  // Sugestões inteligentes
  smartSuggestions?: string[];
  
  // Dados da API
  apiConnected?: boolean;
  jsonLoaded?: boolean;
  allProductsCount?: number;
  
  // Actions
  onSearchSubmit?: (query: string) => void;
  onClearAll?: () => void;
  onToggleFilters?: () => void;
}

export const SearchEmptyStates: React.FC<SearchEmptyStatesProps> = ({
  type,
  searchQuery,
  selectedCategory,
  categoryLabel,
  smartSuggestions = [],
  apiConnected = false,
  jsonLoaded = true,
  allProductsCount = 0,
  onSearchSubmit,
  onClearAll,
  onToggleFilters
}) => {

  // ✅ Estado Inicial - Sem busca
  if (type === 'initial') {
    return (
      <div className="text-center py-16">
        <div className="text-8xl mb-6">🛒</div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">
          Comece sua busca inteligente
        </h3>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Digite o nome do produto que você procura. Nossa IA encontra sinônimos e variações automaticamente!
        </p>
        
        {/* ✅ Sugestões Inteligentes */}
        {smartSuggestions.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <p className="text-sm font-medium text-gray-700">Sugestões inteligentes:</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {smartSuggestions.slice(0, 12).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onSearchSubmit?.(suggestion)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-blue-100 text-gray-700 rounded-full text-sm hover:from-emerald-200 hover:to-blue-200 transition-all font-medium shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            
            {/* Info sobre a busca inteligente */}
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg max-w-2xl mx-auto">
              <div className="flex items-center gap-2 text-emerald-700 text-sm">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">Busca Inteligente PRECIVOX:</span>
              </div>
              <p className="text-emerald-600 text-xs mt-1">
                Encontra produtos mesmo com sinônimos (ex: "carne" encontra carnes, frango, bovina)
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ✅ Nenhum Resultado Encontrado
  if (type === 'no-results') {
    return (
      <div className="text-center py-16">
        <div className="text-8xl mb-6">🔍</div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">
          Nenhum produto encontrado
        </h3>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          {searchQuery && `A busca inteligente não encontrou produtos para "${searchQuery}"`}
          {selectedCategory !== 'all' && ` na categoria "${categoryLabel}"`}.
          Tente uma busca diferente ou ajuste os filtros.
        </p>
        
        {/* ✅ Sugestões Alternativas Inteligentes */}
        {searchQuery && smartSuggestions.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <p className="text-sm font-medium text-gray-700">Tente pesquisar por:</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {smartSuggestions.slice(0, 8).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onSearchSubmit?.(suggestion)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* ✅ Botões de Ação */}
        <div className="flex justify-center gap-4">
          {onClearAll && (
            <button
              onClick={onClearAll}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Limpar tudo
            </button>
          )}
          {onToggleFilters && (
            <button
              onClick={onToggleFilters}
              className="px-6 py-3 bg-[#004A7C] text-white rounded-lg hover:bg-[#0066A3] transition-colors font-medium"
            >
              Ajustar filtros
            </button>
          )}
        </div>
      </div>
    );
  }

  // ✅ API Offline
  if (type === 'api-offline') {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 inline-block">
          <div className="flex items-center text-yellow-800 mb-2">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">API Offline</span>
          </div>
          <p className="text-yellow-700">
            Buscando apenas nos {allProductsCount} produtos locais disponíveis
          </p>
          {!jsonLoaded && (
            <p className="text-yellow-600 text-sm mt-2">
              Base de dados local também indisponível
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
};