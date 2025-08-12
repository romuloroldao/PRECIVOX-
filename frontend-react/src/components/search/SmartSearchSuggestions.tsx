// components/search/SmartSearchSuggestions.tsx - PAINEL DE SUGESTÕES INTELIGENTES
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ChefHat, 
  ShoppingBag, 
  Sparkles, 
  Clock, 
  Brain,
  Star,
  Zap,
  Target,
  ArrowRight,
  Grid3x3,
  Search,
  Heart,
  Coffee,
  Utensils,
  Home,
  Shirt
} from 'lucide-react';

interface SmartSuggestion {
  id: string;
  text: string;
  type: 'trending' | 'recipe' | 'category' | 'seasonal' | 'personal' | 'smart';
  icon: React.ComponentType<any>;
  color: string;
  description?: string;
  popularity?: number;
  tags?: string[];
}

interface SmartSearchSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  variant?: 'homepage' | 'search' | 'compact';
  showPersonalized?: boolean;
  maxSuggestions?: number;
  className?: string;
}

const SmartSearchSuggestions: React.FC<SmartSearchSuggestionsProps> = ({
  onSuggestionClick,
  variant = 'homepage',
  showPersonalized = true,
  maxSuggestions = 12,
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Sugestões inteligentes baseadas em contexto
  const generateSmartSuggestions = (): SmartSuggestion[] => {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    const baseSuggestions: SmartSuggestion[] = [
      // Trending sempre populares
      {
        id: 'arroz',
        text: 'arroz',
        type: 'trending',
        icon: TrendingUp,
        color: 'text-blue-600 bg-blue-100',
        description: 'Mais buscado hoje',
        popularity: 95
      },
      {
        id: 'feijao',
        text: 'feijão',
        type: 'trending',
        icon: TrendingUp,
        color: 'text-blue-600 bg-blue-100',
        description: 'Sempre em alta',
        popularity: 92
      },
      
      // Receitas baseadas no horário
      ...(hour >= 6 && hour <= 10 ? [
        {
          id: 'cafe-manha',
          text: 'ingredientes para café da manhã',
          type: 'recipe' as const,
          icon: Coffee,
          color: 'text-orange-600 bg-orange-100',
          description: 'Perfeito para a manhã',
          tags: ['leite', 'pão', 'café', 'manteiga']
        }
      ] : []),
      
      ...(hour >= 11 && hour <= 14 ? [
        {
          id: 'almoco',
          text: 'ingredientes para almoço',
          type: 'recipe' as const,
          icon: Utensils,
          color: 'text-green-600 bg-green-100',
          description: 'Hora do almoço!',
          tags: ['arroz', 'feijão', 'carne', 'salada']
        }
      ] : []),
      
      ...(hour >= 17 && hour <= 20 ? [
        {
          id: 'jantar',
          text: 'ingredientes para jantar',
          type: 'recipe' as const,
          icon: ChefHat,
          color: 'text-purple-600 bg-purple-100',
          description: 'Prepare o jantar',
          tags: ['sopa', 'pão', 'queijo', 'embutidos']
        }
      ] : []),
      
      // Final de semana = churrasco
      ...(dayOfWeek === 0 || dayOfWeek === 6 ? [
        {
          id: 'churrasco',
          text: 'produtos para churrasco',
          type: 'recipe' as const,
          icon: ChefHat,
          color: 'text-red-600 bg-red-100',
          description: 'Final de semana!',
          tags: ['carne', 'linguiça', 'cerveja', 'carvão']
        }
      ] : []),
      
      // Categorias populares
      {
        id: 'limpeza',
        text: 'produtos de limpeza',
        type: 'category',
        icon: Home,
        color: 'text-cyan-600 bg-cyan-100',
        description: 'Casa sempre limpa',
        popularity: 78
      },
      {
        id: 'bebidas',
        text: 'bebidas',
        type: 'category',
        icon: ShoppingBag,
        color: 'text-indigo-600 bg-indigo-100',
        description: 'Refrescantes',
        popularity: 85
      },
      
      // Sugestões sazonais (exemplo para verão)
      {
        id: 'verao',
        text: 'produtos para o verão',
        type: 'seasonal',
        icon: Star,
        color: 'text-yellow-600 bg-yellow-100',
        description: 'Temporada quente',
        tags: ['protetor solar', 'água', 'sorvete']
      },
      
      // Sugestões inteligentes
      {
        id: 'promocoes',
        text: 'produtos em promoção',
        type: 'smart',
        icon: Sparkles,
        color: 'text-pink-600 bg-pink-100',
        description: 'Ofertas especiais',
        popularity: 88
      },
      {
        id: 'organicos',
        text: 'produtos orgânicos',
        type: 'smart',
        icon: Brain,
        color: 'text-emerald-600 bg-emerald-100',
        description: 'Vida saudável',
        popularity: 72
      },
      {
        id: 'bebe',
        text: 'produtos para bebê',
        type: 'category',
        icon: Heart,
        color: 'text-rose-600 bg-rose-100',
        description: 'Cuidado especial',
        popularity: 65
      }
    ];
    
    // Personalizar baseado no histórico (mock)
    if (showPersonalized) {
      const personalSuggestions: SmartSuggestion[] = [
        {
          id: 'personal-1',
          text: 'suas marcas favoritas',
          type: 'personal',
          icon: Heart,
          color: 'text-red-600 bg-red-100',
          description: 'Baseado no seu perfil'
        },
        {
          id: 'personal-2',
          text: 'produtos que você sempre compra',
          type: 'personal',
          icon: Clock,
          color: 'text-gray-600 bg-gray-100',
          description: 'Compras recorrentes'
        }
      ];
      
      baseSuggestions.push(...personalSuggestions);
    }
    
    return baseSuggestions.slice(0, maxSuggestions);
  };

  useEffect(() => {
    setIsLoading(true);
    // Simular carregamento
    setTimeout(() => {
      const smartSuggestions = generateSmartSuggestions();
      setSuggestions(smartSuggestions);
      setIsLoading(false);
    }, 500);
  }, [showPersonalized, maxSuggestions]);

  const filteredSuggestions = suggestions.filter(s => 
    activeCategory === 'all' || s.type === activeCategory
  );

  const categories = [
    { id: 'all', name: 'Todas', icon: Grid3x3 },
    { id: 'trending', name: 'Trending', icon: TrendingUp },
    { id: 'recipe', name: 'Receitas', icon: ChefHat },
    { id: 'category', name: 'Categorias', icon: ShoppingBag },
    { id: 'smart', name: 'IA', icon: Brain }
  ];

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renderSuggestion = (suggestion: SmartSuggestion) => {
    const IconComponent = suggestion.icon;
    
    return (
      <button
        key={suggestion.id}
        onClick={() => onSuggestionClick(suggestion.text)}
        className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left"
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${suggestion.color} group-hover:scale-110 transition-transform`}>
            <IconComponent className="w-4 h-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {suggestion.text}
              </h4>
              <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
            </div>
            
            <p className="text-xs text-gray-500 mb-2">
              {suggestion.description}
            </p>
            
            {suggestion.popularity && (
              <div className="flex items-center gap-1">
                <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${suggestion.popularity}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{suggestion.popularity}%</span>
              </div>
            )}
            
            {suggestion.tags && suggestion.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {suggestion.tags.slice(0, 2).map((tag, index) => (
                  <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
                {suggestion.tags.length > 2 && (
                  <span className="text-xs text-gray-400">+{suggestion.tags.length - 2}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  if (variant === 'compact') {
    return (
      <div className={`${className}`}>
        <div className="flex flex-wrap gap-2">
          {filteredSuggestions.slice(0, 6).map((suggestion) => {
            const IconComponent = suggestion.icon;
            return (
              <button
                key={suggestion.id}
                onClick={() => onSuggestionClick(suggestion.text)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full hover:border-gray-300 hover:shadow-sm transition-all text-sm"
              >
                <IconComponent className="w-3 h-3 text-gray-500" />
                <span className="text-gray-700">{suggestion.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Sugestões Inteligentes
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Baseado no momento ideal, suas preferências e tendências
          </p>
        </div>
        
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Zap className="w-3 h-3" />
          Atualizado agora
        </div>
      </div>

      {/* Filtros de Categoria */}
      {variant === 'homepage' && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  activeCategory === category.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Grid de Sugestões */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSuggestions.map(renderSuggestion)}
      </div>

      {/* Footer com dicas */}
      {variant === 'homepage' && (
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                💡 Dica: Busca Inteligente
              </h4>
              <p className="text-sm text-gray-600">
                Digite coisas como "ingredientes para bolo", "promoções de carne" ou "produtos para limpeza" 
                e nossa IA encontrará exatamente o que você precisa!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSearchSuggestions;