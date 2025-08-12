// components/dashboard/DashboardFilters.tsx
import React, { useState } from 'react';
import { Filter, MapPin, Calendar, DollarSign, Tag, RotateCcw, Save } from 'lucide-react';

interface FilterState {
  period: '7d' | '30d' | '90d';
  categories: string[];
  stores: string[];
  priceRange: [number, number];
  location: {
    enabled: boolean;
    radius: number;
    city: string;
  };
  realTime: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

interface DashboardFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  location?: { city: string; region: string };
  availableCategories?: string[];
  availableStores?: string[];
  className?: string;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters,
  onFiltersChange,
  location,
  availableCategories = ['bebidas', 'limpeza', 'higiene', 'carnes', 'graos', 'massas'],
  availableStores = ['Mercado São João', 'Extra Franco', 'Hiper Franco', 'Atacadão Franco'],
  className = ''
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [savedFilters, setSavedFilters] = useState<FilterState[]>([]);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const updateLocationFilter = (key: keyof FilterState['location'], value: any) => {
    onFiltersChange({
      ...filters,
      location: { ...filters.location, [key]: value }
    });
  };

  const resetFilters = () => {
    const defaultFilters: FilterState = {
      period: '30d',
      categories: [],
      stores: [],
      priceRange: [0, 1000],
      location: {
        enabled: true,
        radius: 25,
        city: location?.city || 'Franco da Rocha'
      },
      realTime: true
    };
    onFiltersChange(defaultFilters);
  };

  const saveCurrentFilters = () => {
    const filterName = `Filtro ${new Date().toLocaleString('pt-BR')}`;
    setSavedFilters(prev => [...prev, { ...filters }]);
    // Aqui você pode salvar no localStorage ou API
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    updateFilter('categories', newCategories);
  };

  const toggleStore = (store: string) => {
    const newStores = filters.stores.includes(store)
      ? filters.stores.filter(s => s !== store)
      : [...filters.stores, store];
    updateFilter('stores', newStores);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.period !== '30d') count++;
    if (filters.categories.length > 0) count++;
    if (filters.stores.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) count++;
    if (!filters.location.enabled || filters.location.radius !== 25) count++;
    if (!filters.realTime) count++;
    return count;
  };

  const activeCount = getActiveFiltersCount();

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-600" />
          Filtros Avançados
          {activeCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {activeCount} ativo{activeCount !== 1 ? 's' : ''}
            </span>
          )}
        </h3>
        
        <div className="flex items-center gap-2">
          <button
            onClick={saveCurrentFilters}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Limpar
          </button>
        </div>
      </div>

      {/* Filtros Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        
        {/* Período */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Período
          </label>
          <select
            value={filters.period}
            onChange={(e) => updateFilter('period', e.target.value as FilterState['period'])}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
        </div>

        {/* Faixa de Preço */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Faixa de Preço
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.priceRange[0]}
                onChange={(e) => updateFilter('priceRange', [parseInt(e.target.value) || 0, filters.priceRange[1]])}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.priceRange[1]}
                onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], parseInt(e.target.value) || 1000])}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div className="text-xs text-gray-500">
              R$ {filters.priceRange[0]} - R$ {filters.priceRange[1]}
            </div>
          </div>
        </div>

        {/* Localização */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Localização
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.location.enabled}
                onChange={(e) => updateLocationFilter('enabled', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Usar GPS</span>
            </label>
            
            {filters.location.enabled && (
              <>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={filters.location.radius}
                  onChange={(e) => updateLocationFilter('radius', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500">
                  {filters.location.radius} km de {filters.location.city}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Categorias */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Categorias
            {filters.categories.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                {filters.categories.length}
              </span>
            )}
          </label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {availableCategories.map((category) => (
              <label key={category} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category)}
                  onChange={() => toggleCategory(category)}
                  className="rounded"
                />
                <span className="text-sm capitalize">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Lojas */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Lojas
            {filters.stores.length > 0 && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                {filters.stores.length}
              </span>
            )}
          </label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {availableStores.map((store) => (
              <label key={store} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.stores.includes(store)}
                  onChange={() => toggleStore(store)}
                  className="rounded"
                />
                <span className="text-sm">{store}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Configurações Adicionais */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.realTime}
              onChange={(e) => updateFilter('realTime', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium">Dados em tempo real</span>
          </label>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-600">Filtros rápidos:</span>
            <button
              onClick={() => {
                updateFilter('categories', ['bebidas']);
                updateFilter('priceRange', [0, 50]);
              }}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              Bebidas Baratas
            </button>
            <button
              onClick={() => {
                updateFilter('stores', ['Atacadão Franco']);
                updateFilter('priceRange', [0, 100]);
              }}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
            >
              Atacado
            </button>
            <button
              onClick={() => {
                updateLocationFilter('radius', 5);
                updateFilter('realTime', true);
              }}
              className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
            >
              Próximo + Live
            </button>
          </div>
        </div>
      </div>

      {/* Resumo dos Filtros Ativos */}
      {activeCount > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900 font-medium mb-2">Filtros ativos:</p>
          <div className="flex flex-wrap gap-2">
            {filters.period !== '30d' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                📅 {filters.period === '7d' ? '7 dias' : '90 dias'}
              </span>
            )}
            {filters.categories.length > 0 && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                🏷️ {filters.categories.length} categorias
              </span>
            )}
            {filters.stores.length > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                🏪 {filters.stores.length} lojas
              </span>
            )}
            {(filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                💰 R${filters.priceRange[0]}-{filters.priceRange[1]}
              </span>
            )}
            {filters.location.radius !== 25 && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                📍 {filters.location.radius}km
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};