import React from 'react';
import { Filter, X, DollarSign, Star, MapPin, Store, Tag } from 'lucide-react';

interface SearchFilters {
  priceMin: string;
  priceMax: string;
  onlyPromotions: boolean;
  onlyInStock: boolean;
  maxDistance: string;
  mercado: string;
  marca: string;
  rating: number;
  category?: string;
  hasPromotion?: boolean;
  isNew?: boolean;
  isBestPrice?: boolean;
  minRating?: number;
  maxRating?: number;
  sortBy?: string;
  orderBy?: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
  markets: string[];
  brands: string[];
  isOpen: boolean;
  onToggle: () => void;
  priceRange?: { min: number; max: number };
  distanceRange?: { min: number; max: number };
  showDistanceFilter?: boolean;
  showRatingFilter?: boolean;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  markets,
  brands,
  isOpen,
  onToggle,
  priceRange = { min: 0, max: 1000 },
  distanceRange = { min: 0, max: 50 },
  showDistanceFilter = true,
  showRatingFilter = true
}) => {
  
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.priceMin !== '' ||
      filters.priceMax !== '' ||
      filters.onlyPromotions ||
      !filters.onlyInStock ||
      filters.maxDistance !== '' ||
      filters.mercado !== 'all' ||
      filters.marca !== 'all' ||
      filters.rating > 0
    );
  };

  return (
    <div className="relative">
      {/* Botão Toggle */}
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
          isOpen 
            ? 'bg-[#004A7C] text-white border-[#004A7C]' 
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        <Filter className="w-4 h-4" />
        Filtros
        {hasActiveFilters() && (
          <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            !
          </span>
        )}
      </button>

      {/* Panel de Filtros */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-6 z-50 w-96">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Filtros Avançados</h3>
            <div className="flex items-center gap-2">
              {hasActiveFilters() && (
                <button
                  onClick={onClearFilters}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Limpar tudo
                </button>
              )}
              <button
                onClick={onToggle}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="space-y-6">
            
            {/* Faixa de Preço */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <DollarSign className="w-4 h-4" />
                Faixa de Preço
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Mínimo</label>
                  <input
                    type="number"
                    value={filters.priceMin}
                    onChange={(e) => updateFilter('priceMin', e.target.value)}
                    placeholder="R$ 0,00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Máximo</label>
                  <input
                    type="number"
                    value={filters.priceMax}
                    onChange={(e) => updateFilter('priceMax', e.target.value)}
                    placeholder="R$ 999,99"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Mercado/Loja */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Store className="w-4 h-4" />
                Mercado
              </label>
              <select
                value={filters.mercado}
                onChange={(e) => updateFilter('mercado', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
              >
                <option value="all">Todos os mercados</option>
                {markets.map((market) => (
                  <option key={market} value={market}>
                    {market}
                  </option>
                ))}
              </select>
            </div>

            {/* Marca */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Tag className="w-4 h-4" />
                Marca
              </label>
              <select
                value={filters.marca}
                onChange={(e) => updateFilter('marca', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
              >
                <option value="all">Todas as marcas</option>
                {brands.filter(Boolean).map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            {/* Avaliação Mínima */}
            {showRatingFilter && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Star className="w-4 h-4" />
                  Avaliação Mínima
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={filters.rating}
                    onChange={(e) => updateFilter('rating', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-700 min-w-[3rem]">
                    {filters.rating > 0 ? `${filters.rating}★` : 'Todas'}
                  </span>
                </div>
              </div>
            )}

            {/* Distância Máxima */}
            {showDistanceFilter && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <MapPin className="w-4 h-4" />
                  Distância Máxima
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={filters.maxDistance}
                    onChange={(e) => updateFilter('maxDistance', e.target.value)}
                    placeholder="Ex: 10"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                  />
                  <div className="flex items-center text-sm text-gray-500">
                    quilômetros
                  </div>
                </div>
              </div>
            )}

            {/* Filtros Booleanos */}
            <div className="space-y-3 pt-3 border-t border-gray-200">
              
              {/* Apenas Promoções */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.onlyPromotions}
                  onChange={(e) => updateFilter('onlyPromotions', e.target.checked)}
                  className="w-4 h-4 text-[#004A7C] border-gray-300 rounded focus:ring-[#004A7C] focus:ring-2"
                />
                <span className="text-sm text-gray-700">
                  Apenas produtos em promoção
                </span>
                {filters.onlyPromotions && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    🔥 Oferta
                  </span>
                )}
              </label>

              {/* Apenas em Estoque */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.onlyInStock}
                  onChange={(e) => updateFilter('onlyInStock', e.target.checked)}
                  className="w-4 h-4 text-[#004A7C] border-gray-300 rounded focus:ring-[#004A7C] focus:ring-2"
                />
                <span className="text-sm text-gray-700">
                  Apenas produtos disponíveis
                </span>
                {filters.onlyInStock && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    ✅ Estoque
                  </span>
                )}
              </label>

              {/* Filtros Adicionais */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasPromotion}
                  onChange={(e) => updateFilter('hasPromotion', e.target.checked)}
                  className="w-4 h-4 text-[#004A7C] border-gray-300 rounded focus:ring-[#004A7C] focus:ring-2"
                />
                <span className="text-sm text-gray-700">
                  Com desconto especial
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.isNew}
                  onChange={(e) => updateFilter('isNew', e.target.checked)}
                  className="w-4 h-4 text-[#004A7C] border-gray-300 rounded focus:ring-[#004A7C] focus:ring-2"
                />
                <span className="text-sm text-gray-700">
                  Produtos novos
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.isBestPrice}
                  onChange={(e) => updateFilter('isBestPrice', e.target.checked)}
                  className="w-4 h-4 text-[#004A7C] border-gray-300 rounded focus:ring-[#004A7C] focus:ring-2"
                />
                <span className="text-sm text-gray-700">
                  Melhor preço
                </span>
                {filters.isBestPrice && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    💰 Top
                  </span>
                )}
              </label>
            </div>

            {/* Ordenação Adicional */}
            <div className="pt-3 border-t border-gray-200">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                Ordenar por
              </label>
              <select
                value={filters.sortBy || 'relevance'}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
              >
                <option value="relevance">Relevância</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
                <option value="distance">Mais próximo</option>
                <option value="rating">Melhor avaliado</option>
                <option value="discount">Maior desconto</option>
                <option value="newest">Mais novos</option>
                <option value="popularity">Mais populares</option>
                <option value="conversion">Mais vendidos</option>
              </select>

              <div className="flex items-center gap-2 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                  <input
                    type="radio"
                    name="orderBy"
                    value="asc"
                    checked={filters.orderBy === 'asc'}
                    onChange={(e) => updateFilter('orderBy', e.target.value)}
                    className="w-3 h-3"
                  />
                  Crescente
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                  <input
                    type="radio"
                    name="orderBy"
                    value="desc"
                    checked={filters.orderBy === 'desc'}
                    onChange={(e) => updateFilter('orderBy', e.target.value)}
                    className="w-3 h-3"
                  />
                  Decrescente
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {hasActiveFilters() ? 'Filtros aplicados' : 'Nenhum filtro ativo'}
            </div>
            <div className="flex items-center gap-3">
              {hasActiveFilters() && (
                <button
                  onClick={onClearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Limpar
                </button>
              )}
              <button
                onClick={onToggle}
                className="px-4 py-2 bg-[#004A7C] text-white rounded-lg hover:bg-[#0066A3] transition-colors text-sm font-medium"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;