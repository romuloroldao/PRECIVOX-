import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  X, 
  MapPin, 
  TrendingUp,
  BarChart3,
  Sliders
} from 'lucide-react';
import CategoryFilter from '../controls/CategoryFilter';
import AdvancedFilters from '../controls/AdvancedFilters';
import SearchStats from '../stats/SearchStats';
import LocationDisplay from '../stats/LocationDisplay';

interface SearchFiltersSectionProps {
  // Controle de expansão
  isExpanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
  
  // Props para CategoryFilter
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  
  // Props para AdvancedFilters
  filters?: any;
  onFiltersChange?: (filters: any) => void;
  
  // Props para SearchStats
  searchQuery?: string;
  resultsCount?: number;
  searchTime?: number;
  
  // Props para LocationDisplay
  currentLocation?: string;
  
  // Configurações de layout
  showStats?: boolean;
  showLocation?: boolean;
  showAdvancedFilters?: boolean;
  variant?: 'full' | 'compact' | 'minimal';
  
  // Callbacks
  onClearFilters?: () => void;
  onApplyFilters?: () => void;
  
  className?: string;
}

const SearchFiltersSection: React.FC<SearchFiltersSectionProps> = ({
  isExpanded = false,
  onToggleExpanded,
  selectedCategory = '',
  onCategoryChange,
  filters = {},
  onFiltersChange,
  searchQuery = '',
  resultsCount = 0,
  searchTime = 0,
  currentLocation = 'Franco da Rocha, SP',
  showStats = true,
  showLocation = true,
  showAdvancedFilters = true,
  variant = 'full',
  onClearFilters,
  onApplyFilters,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'filters' | 'stats'>('categories');
  
  // Verifica se há filtros ativos
  const hasActiveFilters = selectedCategory || Object.keys(filters).some(key => 
    filters[key] && filters[key] !== '' && filters[key] !== 0
  );
  
  const hasAdvancedFilters = Object.keys(filters).length > 0;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'categories':
        return (
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            variant="grid"
          />
        );
      
      case 'filters':
        return showAdvancedFilters ? (
          <AdvancedFilters
            filters={filters}
            onFiltersChange={onFiltersChange}
            layout="grid"
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Sliders className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Filtros avançados não disponíveis</p>
          </div>
        );
      
      case 'stats':
        return (
          <div className="space-y-4">
            {showStats && (
              <SearchStats
                searchQuery={searchQuery}
                resultsCount={resultsCount}
                searchTime={searchTime}
                variant="detailed"
              />
            )}
            {showLocation && (
              <LocationDisplay
                location={currentLocation}
                variant="full"
              />
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderMinimalVersion = () => (
    <div className={`search-filters-minimal ${className}`}>
      <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center space-x-3">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            variant="select"
          />
          
          {showAdvancedFilters && (
            <button
              onClick={() => onToggleExpanded?.(!isExpanded)}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${hasAdvancedFilters 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              <Filter className="w-4 h-4 mr-1 inline" />
              Filtros
              {hasAdvancedFilters && (
                <span className="ml-1 bg-blue-500 text-white rounded-full px-1.5 py-0.5 text-xs">
                  {Object.keys(filters).length}
                </span>
              )}
            </button>
          )}
        </div>
        
        {hasActiveFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-red-600 hover:text-red-700 flex items-center"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar
          </button>
        )}
      </div>
    </div>
  );

  const renderCompactVersion = () => (
    <div className={`search-filters-compact ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <h3 className="font-medium text-gray-900">Filtros</h3>
            {hasActiveFilters && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                Ativos
              </span>
            )}
          </div>
          
          {onToggleExpanded && (
            <button
              onClick={() => onToggleExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          )}
        </div>
        
        {/* Content */}
        {isExpanded && (
          <div className="p-4 space-y-4">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
              variant="compact"
            />
            
            {showAdvancedFilters && (
              <AdvancedFilters
                filters={filters}
                onFiltersChange={onFiltersChange}
                layout="vertical"
              />
            )}
            
            {/* Actions */}
            {(onClearFilters || onApplyFilters) && (
              <div className="flex justify-between pt-3 border-t">
                {onClearFilters && (
                  <button
                    onClick={onClearFilters}
                    disabled={!hasActiveFilters}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 disabled:opacity-50"
                  >
                    Limpar filtros
                  </button>
                )}
                
                {onApplyFilters && (
                  <button
                    onClick={onApplyFilters}
                    className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    Aplicar
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderFullVersion = () => (
    <div className={`search-filters-full ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header com Tabs */}
        <div className="border-b">
          <div className="flex items-center justify-between p-4 pb-0">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <h3 className="font-medium text-gray-900">Filtros e Estatísticas</h3>
              {hasActiveFilters && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                  {Object.keys(filters).filter(key => filters[key]).length} ativos
                </span>
              )}
            </div>
            
            {onToggleExpanded && (
              <button
                onClick={() => onToggleExpanded(!isExpanded)}
                className="text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            )}
          </div>
          
          {/* Tabs */}
          {isExpanded && (
            <div className="flex space-x-1 px-4 pt-2 pb-3">
              <button
                onClick={() => setActiveTab('categories')}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                  ${activeTab === 'categories'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <BarChart3 className="w-4 h-4 mr-1 inline" />
                Categorias
              </button>
              
              {showAdvancedFilters && (
                <button
                  onClick={() => setActiveTab('filters')}
                  className={`
                    px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                    ${activeTab === 'filters'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Sliders className="w-4 h-4 mr-1 inline" />
                  Avançados
                  {hasAdvancedFilters && (
                    <span className="ml-1 bg-blue-500 text-white rounded-full px-1.5 py-0.5 text-xs">
                      {Object.keys(filters).length}
                    </span>
                  )}
                </button>
              )}
              
              {(showStats || showLocation) && (
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`
                    px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                    ${activeTab === 'stats'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <TrendingUp className="w-4 h-4 mr-1 inline" />
                  Estatísticas
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Content */}
        {isExpanded && (
          <div className="p-4">
            {renderTabContent()}
            
            {/* Actions */}
            {(onClearFilters || onApplyFilters) && (
              <div className="flex justify-between items-center pt-4 mt-4 border-t">
                <div className="flex items-center space-x-2">
                  {showLocation && currentLocation && (
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      {currentLocation}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {onClearFilters && (
                    <button
                      onClick={onClearFilters}
                      disabled={!hasActiveFilters}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 disabled:opacity-50"
                    >
                      Limpar filtros
                    </button>
                  )}
                  
                  {onApplyFilters && (
                    <button
                      onClick={onApplyFilters}
                      className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Aplicar filtros
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Renderizar baseado na variante
  switch (variant) {
    case 'minimal':
      return renderMinimalVersion();
    case 'compact':
      return renderCompactVersion();
    case 'full':
    default:
      return renderFullVersion();
  }
};

export default SearchFiltersSection;