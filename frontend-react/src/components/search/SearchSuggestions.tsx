import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  TrendingUp, 
  Star, 
  Zap, 
  X, 
  ArrowUpRight,
  Brain,
  Tag,
  MapPin,
  Users,
  Sparkles
} from 'lucide-react';

interface Suggestion {
  id: string;
  text: string;
  type: 'history' | 'trending' | 'ai' | 'popular' | 'category' | 'location' | 'brand';
  metadata?: {
    category?: string;
    price?: string;
    discount?: string;
    popularity?: number;
    location?: string;
    brand?: string;
    aiConfidence?: number;
  };
}

interface SearchSuggestionsProps {
  // Estado da busca
  searchQuery: string;
  isVisible: boolean;
  isLoading?: boolean;
  
  // Dados
  suggestions?: Suggestion[];
  recentSearches?: string[];
  trendingSearches?: string[];
  
  // Configurações
  maxSuggestions?: number;
  showCategories?: boolean;
  showTrending?: boolean;
  showHistory?: boolean;
  showAI?: boolean;
  showPopular?: boolean;
  
  // Layout
  variant?: 'dropdown' | 'fullscreen' | 'inline' | 'modal';
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom' | 'top';
  
  // Callbacks
  onSelectSuggestion: (suggestion: string | Suggestion) => void;
  onClearHistory?: () => void;
  onRemoveHistoryItem?: (item: string) => void;
  onRequestAI?: (query: string) => void;
  
  // Funcionalidades avançadas
  enableAI?: boolean;
  enableVoiceSearch?: boolean;
  enableImageSearch?: boolean;
  
  className?: string;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  searchQuery = '',
  isVisible = false,
  isLoading = false,
  suggestions = [],
  recentSearches = [],
  trendingSearches = [],
  maxSuggestions = 10,
  showCategories = true,
  showTrending = true,
  showHistory = true,
  showAI = true,
  showPopular = true,
  variant = 'dropdown',
  size = 'md',
  position = 'bottom',
  onSelectSuggestion,
  onClearHistory,
  onRemoveHistoryItem,
  onRequestAI,
  enableAI = true,
  enableVoiceSearch = false,
  enableImageSearch = false,
  className = ''
}) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [aiSuggestions, setAiSuggestions] = useState<Suggestion[]>([]);
  
  // Sugestões padrão quando não há query
  const defaultSuggestions: Suggestion[] = [
    { id: '1', text: 'arroz', type: 'popular', metadata: { category: 'Grãos', popularity: 95 } },
    { id: '2', text: 'feijão', type: 'popular', metadata: { category: 'Grãos', popularity: 90 } },
    { id: '3', text: 'açúcar', type: 'trending', metadata: { category: 'Doces', discount: '15%' } },
    { id: '4', text: 'óleo de soja', type: 'popular', metadata: { category: 'Óleos', popularity: 85 } },
    { id: '5', text: 'macarrão', type: 'trending', metadata: { category: 'Massas', popularity: 88 } },
    { id: '6', text: 'leite', type: 'popular', metadata: { category: 'Laticínios', popularity: 92 } },
    { id: '7', text: 'pão de açúcar', type: 'brand', metadata: { brand: 'Pão de Açúcar', location: 'Franco da Rocha' } },
    { id: '8', text: 'promoções do dia', type: 'category', metadata: { category: 'Ofertas', discount: 'até 50%' } }
  ];
  
  // Categorias populares
  const popularCategories = [
    { name: 'Hortifruti', icon: '🥬', searches: 1250 },
    { name: 'Carnes', icon: '🥩', searches: 980 },
    { name: 'Laticínios', icon: '🥛', searches: 850 },
    { name: 'Bebidas', icon: '🥤', searches: 720 },
    { name: 'Limpeza', icon: '🧽', searches: 680 },
    { name: 'Higiene', icon: '🧴', searches: 620 }
  ];

  // Busca por IA simulada
  useEffect(() => {
    if (enableAI && searchQuery.length >= 2) {
      const aiTimer = setTimeout(() => {
        const mockAISuggestions: Suggestion[] = [
          {
            id: 'ai-1',
            text: `${searchQuery} orgânico`,
            type: 'ai',
            metadata: { aiConfidence: 85, category: 'Orgânicos' }
          },
          {
            id: 'ai-2',
            text: `promoções de ${searchQuery}`,
            type: 'ai',
            metadata: { aiConfidence: 78, discount: 'até 30%' }
          },
          {
            id: 'ai-3',
            text: `${searchQuery} + receita`,
            type: 'ai',
            metadata: { aiConfidence: 72, category: 'Receitas' }
          }
        ];
        setAiSuggestions(mockAISuggestions);
      }, 300);
      
      return () => clearTimeout(aiTimer);
    } else {
      setAiSuggestions([]);
    }
  }, [searchQuery, enableAI]);

  // Filtrar e organizar sugestões
  const getFilteredSuggestions = (): Suggestion[] => {
    if (!searchQuery) {
      return defaultSuggestions.slice(0, maxSuggestions);
    }
    
    const filtered = suggestions.filter(s => 
      s.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Adicionar sugestões de IA
    if (showAI && aiSuggestions.length > 0) {
      filtered.unshift(...aiSuggestions);
    }
    
    return filtered.slice(0, maxSuggestions);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'history': return Clock;
      case 'trending': return TrendingUp;
      case 'ai': return Brain;
      case 'popular': return Star;
      case 'category': return Tag;
      case 'location': return MapPin;
      case 'brand': return Users;
      default: return Search;
    }
  };

  const getSuggestionBadge = (suggestion: Suggestion) => {
    const { type, metadata } = suggestion;
    
    switch (type) {
      case 'ai':
        return (
          <span className="flex items-center text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3 mr-1" />
            IA {metadata?.aiConfidence}%
          </span>
        );
      case 'trending':
        return (
          <span className="flex items-center text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3 mr-1" />
            Tendência
          </span>
        );
      case 'popular':
        return (
          <span className="flex items-center text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            <Star className="w-3 h-3 mr-1" />
            Popular
          </span>
        );
      default:
        return null;
    }
  };

  const renderSuggestionItem = (suggestion: Suggestion, index: number) => {
    const IconComponent = getSuggestionIcon(suggestion.type);
    const isActive = index === activeIndex;
    
    return (
      <div
        key={suggestion.id}
        onClick={() => onSelectSuggestion(suggestion)}
        className={`
          flex items-center justify-between p-3 cursor-pointer transition-colors
          ${isActive ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-gray-50'}
        `}
      >
        <div className="flex items-center flex-1 min-w-0">
          <IconComponent className={`
            w-4 h-4 mr-3 flex-shrink-0
            ${suggestion.type === 'ai' ? 'text-purple-500' : 
              suggestion.type === 'trending' ? 'text-orange-500' :
              suggestion.type === 'popular' ? 'text-blue-500' :
              'text-gray-400'}
          `} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 truncate">{suggestion.text}</span>
              {getSuggestionBadge(suggestion)}
            </div>
            
            {suggestion.metadata && (
              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                {suggestion.metadata.category && (
                  <span>em {suggestion.metadata.category}</span>
                )}
                {suggestion.metadata.discount && (
                  <span className="text-green-600 font-medium">
                    {suggestion.metadata.discount} OFF
                  </span>
                )}
                {suggestion.metadata.popularity && (
                  <span>{suggestion.metadata.popularity}% dos usuários</span>
                )}
                {suggestion.metadata.location && (
                  <span className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {suggestion.metadata.location}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {suggestion.type === 'history' && onRemoveHistoryItem && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveHistoryItem(suggestion.text);
            }}
            className="text-gray-400 hover:text-gray-600 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        <ArrowUpRight className="w-4 h-4 text-gray-400 ml-2" />
      </div>
    );
  };

  const renderHistorySection = () => {
    if (!showHistory || recentSearches.length === 0) return null;
    
    return (
      <div className="border-b border-gray-100">
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
          <div className="flex items-center text-sm font-medium text-gray-700">
            <Clock className="w-4 h-4 mr-2" />
            Buscas recentes
          </div>
          {onClearHistory && (
            <button
              onClick={onClearHistory}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Limpar tudo
            </button>
          )}
        </div>
        
        <div className="max-h-32 overflow-y-auto">
          {recentSearches.slice(0, 5).map((search, index) => (
            <div
              key={index}
              onClick={() => onSelectSuggestion(search)}
              className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-3 text-gray-400" />
                <span className="text-gray-700">{search}</span>
              </div>
              {onRemoveHistoryItem && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveHistoryItem(search);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCategoriesSection = () => {
    if (!showCategories || searchQuery) return null;
    
    return (
      <div className="border-b border-gray-100">
        <div className="px-3 py-2 bg-gray-50">
          <div className="flex items-center text-sm font-medium text-gray-700">
            <Tag className="w-4 h-4 mr-2" />
            Categorias populares
          </div>
        </div>
        
        <div className="p-3 grid grid-cols-2 gap-2">
          {popularCategories.map((category, index) => (
            <button
              key={index}
              onClick={() => onSelectSuggestion(category.name)}
              className="flex items-center p-2 rounded-lg hover:bg-gray-50 text-left"
            >
              <span className="text-lg mr-2">{category.icon}</span>
              <div>
                <div className="text-sm font-medium text-gray-900">{category.name}</div>
                <div className="text-xs text-gray-500">{category.searches} buscas</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderTrendingSection = () => {
    if (!showTrending || trendingSearches.length === 0) return null;
    
    return (
      <div className="border-b border-gray-100">
        <div className="px-3 py-2 bg-gray-50">
          <div className="flex items-center text-sm font-medium text-gray-700">
            <TrendingUp className="w-4 h-4 mr-2" />
            Tendências em Franco da Rocha
          </div>
        </div>
        
        <div className="p-3 space-y-1">
          {trendingSearches.slice(0, 4).map((search, index) => (
            <button
              key={index}
              onClick={() => onSelectSuggestion(search)}
              className="flex items-center w-full p-2 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-600 rounded-full text-xs font-bold mr-3">
                {index + 1}
              </div>
              <span className="text-gray-900">{search}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderAISection = () => {
    if (!enableAI || !searchQuery) return null;
    
    return (
      <div className="border-b border-gray-100">
        <div className="px-3 py-2 bg-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm font-medium text-purple-700">
              <Brain className="w-4 h-4 mr-2" />
              Sugestões inteligentes
            </div>
            {onRequestAI && (
              <button
                onClick={() => onRequestAI(searchQuery)}
                className="text-xs text-purple-600 hover:text-purple-700"
              >
                Mais sugestões IA
              </button>
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-3 text-center">
            <div className="inline-flex items-center text-sm text-gray-500">
              <Zap className="w-4 h-4 mr-2 animate-pulse" />
              IA gerando sugestões...
            </div>
          </div>
        ) : (
          <div className="max-h-40 overflow-y-auto">
            {aiSuggestions.map((suggestion, index) => 
              renderSuggestionItem(suggestion, index)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDropdown = () => (
    <div className={`
      search-suggestions-dropdown absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200
      ${position === 'top' ? 'bottom-full mb-1 mt-0' : ''}
      ${size === 'sm' ? 'max-h-64' : size === 'lg' ? 'max-h-96' : 'max-h-80'}
      ${className}
    `}>
      <div className="overflow-hidden rounded-lg">
        {renderHistorySection()}
        {renderCategoriesSection()}
        {renderTrendingSection()}
        {renderAISection()}
        
        {/* Sugestões principais */}
        <div className="max-h-64 overflow-y-auto">
          {getFilteredSuggestions().map((suggestion, index) => 
            renderSuggestionItem(suggestion, index)
          )}
        </div>
        
        {/* Footer com dicas */}
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>💡 Dica: Use palavras-chave específicas</span>
            <div className="flex items-center space-x-2">
              {enableVoiceSearch && (
                <span className="flex items-center">🎤 Voz</span>
              )}
              {enableImageSearch && (
                <span className="flex items-center">📷 Imagem</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInline = () => (
    <div className={`search-suggestions-inline space-y-2 ${className}`}>
      {getFilteredSuggestions().slice(0, 3).map((suggestion, index) => (
        <button
          key={suggestion.id}
          onClick={() => onSelectSuggestion(suggestion)}
          className="flex items-center w-full p-2 text-left hover:bg-gray-50 rounded-lg"
        >
          {getSuggestionIcon(suggestion.type)({ className: "w-4 h-4 mr-2 text-gray-400" })}
          <span className="text-gray-700">{suggestion.text}</span>
        </button>
      ))}
    </div>
  );

  const renderModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Sugestões de busca</h3>
        </div>
        <div className="overflow-y-auto max-h-[60vh]">
          {renderHistorySection()}
          {renderCategoriesSection()}
          {renderTrendingSection()}
          {renderAISection()}
          
          <div>
            {getFilteredSuggestions().map((suggestion, index) => 
              renderSuggestionItem(suggestion, index)
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (!isVisible) return null;

  // Renderizar baseado na variante
  switch (variant) {
    case 'inline':
      return renderInline();
    case 'modal':
      return renderModal();
    case 'fullscreen':
      return (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          {renderDropdown()}
        </div>
      );
    case 'dropdown':
    default:
      return renderDropdown();
  }
};

export default SearchSuggestions;