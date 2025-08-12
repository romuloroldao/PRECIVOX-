// components/controls/ActiveFiltersDisplay.tsx - EXIBIÇÃO DE FILTROS ATIVOS
import React from 'react';
import { X, Filter, Tag, DollarSign, MapPin, Store, Star, Zap, Sparkles } from 'lucide-react';
import { SearchFilters } from '../../types/index';

interface ActiveFilter {
  key: string;
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
  onRemove: () => void;
}

interface ActiveFiltersDisplayProps {
  filters: SearchFilters;
  quickFilters?: {
    searchTerm: string;
    activeQuickFilter: string | null;
  };
  onRemoveFilter: (key: string) => void;
  onClearAllFilters: () => void;
  onClearSearchTerm?: () => void;
  showCount?: boolean;
  compact?: boolean;
  className?: string;
}

const ActiveFiltersDisplay: React.FC<ActiveFiltersDisplayProps> = ({
  filters,
  quickFilters,
  onRemoveFilter,
  onClearAllFilters,
  onClearSearchTerm,
  showCount = true,
  compact = false,
  className = ''
}) => {
  
  // ✅ CONSTRUIR LISTA DE FILTROS ATIVOS
  const activeFilters: ActiveFilter[] = [];

  // Filtro de busca
  if (quickFilters?.searchTerm) {
    activeFilters.push({
      key: 'searchTerm',
      label: 'Busca',
      value: `"${quickFilters.searchTerm}"`,
      icon: Filter,
      color: 'blue',
      onRemove: onClearSearchTerm || (() => {})
    });
  }

  // Filtro de categoria
  if (filters.category && filters.category !== 'all' && filters.category !== '') {
    activeFilters.push({
      key: 'category',
      label: 'Categoria',
      value: filters.category.charAt(0).toUpperCase() + filters.category.slice(1),
      icon: Tag,
      color: 'green',
      onRemove: () => onRemoveFilter('category')
    });
  }

  // Filtros de preço
  if (filters.priceMin || filters.priceMax) {
    const priceLabel = filters.priceMin && filters.priceMax 
      ? `R$ ${filters.priceMin} - R$ ${filters.priceMax}`
      : filters.priceMin 
        ? `A partir de R$ ${filters.priceMin}`
        : `Até R$ ${filters.priceMax}`;
    
    activeFilters.push({
      key: 'price',
      label: 'Preço',
      value: priceLabel,
      icon: DollarSign,
      color: 'yellow',
      onRemove: () => {
        onRemoveFilter('priceMin');
        onRemoveFilter('priceMax');
      }
    });
  }

  // Filtro de mercado
  if (filters.mercado && filters.mercado !== 'all') {
    activeFilters.push({
      key: 'mercado',
      label: 'Mercado',
      value: filters.mercado,
      icon: Store,
      color: 'purple',
      onRemove: () => onRemoveFilter('mercado')
    });
  }

  // Filtro de marca
  if (filters.marca && filters.marca !== 'all') {
    activeFilters.push({
      key: 'marca',
      label: 'Marca',
      value: filters.marca,
      icon: Tag,
      color: 'indigo',
      onRemove: () => onRemoveFilter('marca')
    });
  }

  // Filtro de distância
  if (filters.maxDistance) {
    activeFilters.push({
      key: 'maxDistance',
      label: 'Distância',
      value: `${filters.maxDistance}km`,
      icon: MapPin,
      color: 'orange',
      onRemove: () => onRemoveFilter('maxDistance')
    });
  }

  // Filtro de avaliação
  if (filters.rating > 0) {
    activeFilters.push({
      key: 'rating',
      label: 'Avaliação',
      value: `${filters.rating}★+`,
      icon: Star,
      color: 'yellow',
      onRemove: () => onRemoveFilter('rating')
    });
  }

  // Filtros booleanos
  if (filters.onlyPromotions) {
    activeFilters.push({
      key: 'onlyPromotions',
      label: 'Promoções',
      value: 'Apenas ofertas',
      icon: Zap,
      color: 'red',
      onRemove: () => onRemoveFilter('onlyPromotions')
    });
  }

  if (filters.hasPromotion) {
    activeFilters.push({
      key: 'hasPromotion',
      label: 'Desconto',
      value: 'Com desconto',
      icon: Zap,
      color: 'red',
      onRemove: () => onRemoveFilter('hasPromotion')
    });
  }

  if (filters.isNew) {
    activeFilters.push({
      key: 'isNew',
      label: 'Novidades',
      value: 'Produtos novos',
      icon: Sparkles,
      color: 'green',
      onRemove: () => onRemoveFilter('isNew')
    });
  }

  if (filters.isBestPrice) {
    activeFilters.push({
      key: 'isBestPrice',
      label: 'Melhor Preço',
      value: 'Melhor preço',
      icon: DollarSign,
      color: 'green',
      onRemove: () => onRemoveFilter('isBestPrice')
    });
  }

  if (!filters.onlyInStock) {
    activeFilters.push({
      key: 'onlyInStock',
      label: 'Estoque',
      value: 'Incluindo esgotados',
      icon: Store,
      color: 'gray',
      onRemove: () => onRemoveFilter('onlyInStock')
    });
  }

  // ✅ SE NÃO HÁ FILTROS ATIVOS, NÃO RENDERIZAR
  if (activeFilters.length === 0) {
    return null;
  }

  // ✅ CORES POR TIPO
  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Filtros Ativos
            {showCount && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                {activeFilters.length}
              </span>
            )}
          </span>
        </div>
        
        {activeFilters.length > 1 && (
          <button
            onClick={onClearAllFilters}
            className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            Limpar tudo
          </button>
        )}
      </div>

      {/* Lista de filtros */}
      <div className={`flex flex-wrap gap-2 ${compact ? 'gap-1' : 'gap-2'}`}>
        {activeFilters.map((filter) => {
          const Icon = filter.icon;
          const colorClasses = getColorClasses(filter.color);
          
          return (
            <div
              key={filter.key}
              className={`
                inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200
                ${colorClasses} hover:shadow-sm
                ${compact ? 'text-xs px-2 py-1' : 'text-sm'}
              `}
            >
              <Icon className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0`} />
              
              {!compact && (
                <span className="font-medium">
                  {filter.label}:
                </span>
              )}
              
              <span className={compact ? 'font-medium' : ''}>
                {filter.value}
              </span>
              
              <button
                onClick={filter.onRemove}
                className={`
                  flex-shrink-0 rounded-full transition-colors
                  ${compact ? 'p-0.5' : 'p-1'}
                  hover:bg-black/10
                `}
                title={`Remover filtro ${filter.label}`}
              >
                <X className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer com informações adicionais */}
      {!compact && activeFilters.length > 3 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Você pode remover filtros individualmente ou limpar tudo de uma vez
            </span>
            <button
              onClick={onClearAllFilters}
              className="text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              Limpar tudo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveFiltersDisplay;