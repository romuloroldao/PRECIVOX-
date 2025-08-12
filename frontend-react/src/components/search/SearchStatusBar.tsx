// src/components/search/SearchStatusBar.tsx
// ✅ COMPONENTE REUTILIZÁVEL SEGUINDO ARQUITETURA v7.0
import React from 'react';
import { Search, Filter, Grid, List, Zap, Brain, AlertCircle, CheckCircle } from 'lucide-react';

interface SearchStatusBarProps {
  // ✅ RESULTADOS
  totalResults: number;
  filteredResults: number;
  searchQuery?: string;
  isLoading?: boolean;
  
  // ✅ FILTROS ATIVOS
  activeFilters?: number;
  hasActiveFilters?: boolean;
  
  // ✅ IA STATUS
  aiSuggestionsCount?: number;
  aiAppliedCount?: number;
  showAIStatus?: boolean;
  
  // ✅ VIEW MODE
  viewMode?: 'grid' | 'list' | 'card' | 'compact' | 'table';
  onViewModeChange?: (mode: 'grid' | 'list' | 'card' | 'compact' | 'table') => void;
  
  // ✅ AÇÕES
  onClearFilters?: () => void;
  onAIAnalysis?: () => void;
  
  // ✅ CONFIGURAÇÃO
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
  showViewToggle?: boolean;
  showFilterCount?: boolean;
}

const SearchStatusBar: React.FC<SearchStatusBarProps> = ({
  totalResults = 0,
  filteredResults = 0,
  searchQuery = '',
  isLoading = false,
  activeFilters = 0,
  hasActiveFilters = false,
  aiSuggestionsCount = 0,
  aiAppliedCount = 0,
  showAIStatus = false,
  viewMode = 'grid',
  onViewModeChange,
  onClearFilters,
  onAIAnalysis,
  className = '',
  variant = 'default',
  showViewToggle = true,
  showFilterCount = true
}) => {

  // ✅ FORMATAÇÃO DE NÚMEROS
  const formatCount = (count: number): string => {
    if (count === 0) return '0';
    if (count === 1) return '1';
    return count.toLocaleString('pt-BR');
  };

  // ✅ TEXTO DE STATUS INTELIGENTE
  const getStatusText = (): string => {
    if (isLoading) return 'Carregando...';
    
    if (searchQuery) {
      if (filteredResults === 0) {
        return `Nenhum resultado para "${searchQuery}"`;
      }
      if (filteredResults !== totalResults) {
        return `${formatCount(filteredResults)} de ${formatCount(totalResults)} resultados para "${searchQuery}"`;
      }
      return `${formatCount(filteredResults)} resultados para "${searchQuery}"`;
    }
    
    if (hasActiveFilters && filteredResults !== totalResults) {
      return `${formatCount(filteredResults)} de ${formatCount(totalResults)} produtos`;
    }
    
    return `${formatCount(totalResults)} produtos`;
  };

  // ✅ ESTILOS POR VARIANTE
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg';
      case 'minimal':
        return 'px-2 py-1 text-sm';
      default:
        return 'px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm';
    }
  };

  return (
    <div className={`flex items-center justify-between ${getVariantClasses()} ${className}`}>
      
      {/* ✅ STATUS PRINCIPAL */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Search className={`${variant === 'minimal' ? 'w-3 h-3' : 'w-4 h-4'} text-gray-500`} />
          <span className={`${variant === 'minimal' ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>
            {getStatusText()}
          </span>
        </div>

        {/* ✅ FILTROS ATIVOS */}
        {showFilterCount && hasActiveFilters && activeFilters > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              <Filter className="w-3 h-3" />
              <span>{activeFilters} {activeFilters === 1 ? 'filtro' : 'filtros'}</span>
            </div>
            
            {onClearFilters && (
              <button
                onClick={onClearFilters}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Limpar
              </button>
            )}
          </div>
        )}

        {/* ✅ STATUS IA */}
        {showAIStatus && (aiSuggestionsCount > 0 || aiAppliedCount > 0) && (
          <div className="flex items-center gap-2">
            {aiAppliedCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                <CheckCircle className="w-3 h-3" />
                <span>{aiAppliedCount} IA aplicadas</span>
              </div>
            )}
            
            {aiSuggestionsCount > 0 && aiAppliedCount < aiSuggestionsCount && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                <Brain className="w-3 h-3" />
                <span>{aiSuggestionsCount - aiAppliedCount} sugestões</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ✅ CONTROLES DIREITA */}
      <div className="flex items-center gap-3">
        
        {/* ✅ BOTÃO IA ANALYSIS */}
        {onAIAnalysis && aiSuggestionsCount > 0 && (
          <button
            onClick={onAIAnalysis}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors"
          >
            <Brain className="w-3 h-3" />
            <span>IA</span>
            {aiSuggestionsCount > 0 && (
              <span className="bg-purple-600 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                {aiSuggestionsCount}
              </span>
            )}
          </button>
        )}

        {/* ✅ VIEW MODE TOGGLE */}
        {showViewToggle && onViewModeChange && variant !== 'minimal' && (
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded ${
                viewMode === 'grid' 
                  ? 'bg-[#004A7C] text-white' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Visualização em grade"
            >
              <Grid className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded ${
                viewMode === 'list' 
                  ? 'bg-[#004A7C] text-white' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Visualização em lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchStatusBar;