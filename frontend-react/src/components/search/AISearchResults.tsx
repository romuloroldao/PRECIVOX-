// components/search/AISearchResults.tsx - RESULTADOS DE BUSCA COM IA
import React, { useState, useMemo } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Clock, 
  Sparkles, 
  ChefHat,
  ShoppingCart,
  Zap,
  Info,
  Star,
  MapPin,
  Tag,
  ArrowRight,
  BarChart3,
  Filter,
  Grid,
  List,
  Eye
} from 'lucide-react';

import { Product } from '../../types/product';
import { AISearchResult, AISearchSuggestion } from '../../services/aiSearchService';
import ProductCard from '../products/ProductCard';

interface AISearchResultsProps {
  searchResult: AISearchResult;
  onProductClick: (product: Product) => void;
  onAddToList?: (product: Product) => void;
  onSuggestionClick: (suggestion: string) => void;
  viewMode?: 'grid' | 'list';
  formatPrice: (price: number) => string;
  className?: string;
}

const AISearchResults: React.FC<AISearchResultsProps> = ({
  searchResult,
  onProductClick,
  onAddToList,
  onSuggestionClick,
  viewMode = 'grid',
  formatPrice,
  className = ''
}) => {
  const [showInsights, setShowInsights] = useState(true);
  const [activeInsightTab, setActiveInsightTab] = useState<'intent' | 'suggestions' | 'stats'>('intent');

  const {
    products,
    intent,
    suggestions,
    corrections,
    relatedQueries,
    semanticMatches,
    totalMatches,
    processingTime
  } = searchResult;

  /**
   * ✅ ANÁLISE DOS RESULTADOS
   */
  const analysisData = useMemo(() => {
    if (products.length === 0) return null;

    const categories = Array.from(new Set(products.map(p => p.categoria)));
    const brands = Array.from(new Set(products.map(p => p.marca).filter(Boolean)));
    const avgPrice = products.reduce((sum, p) => sum + p.preco, 0) / products.length;
    const priceRange = {
      min: Math.min(...products.map(p => p.preco)),
      max: Math.max(...products.map(p => p.preco))
    };
    const promotionsCount = products.filter(p => p.promocao).length;
    const availableCount = products.filter(p => p.disponivel).length;

    return {
      categories,
      brands,
      avgPrice,
      priceRange,
      promotionsCount,
      availableCount,
      totalProducts: products.length
    };
  }, [products]);

  /**
   * ✅ SUGESTÕES CATEGORIZADAS
   */
  const categorizedSuggestions = useMemo(() => {
    const categories = {
      recipe: suggestions.filter(s => s.type === 'recipe'),
      semantic: suggestions.filter(s => s.type === 'semantic'),
      trending: suggestions.filter(s => s.type === 'trending'),
      related: suggestions.filter(s => s.type === 'related'),
      corrected: suggestions.filter(s => s.type === 'corrected')
    };
    return categories;
  }, [suggestions]);

  /**
   * ✅ COMPONENTE: INSIGHTS DA BUSCA
   */
  const SearchInsights = () => {
    if (!showInsights) return null;

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Insights da Busca IA
          </h3>
          <button
            onClick={() => setShowInsights(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs dos Insights */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveInsightTab('intent')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeInsightTab === 'intent'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            Intenção
          </button>
          <button
            onClick={() => setActiveInsightTab('suggestions')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeInsightTab === 'suggestions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            Sugestões ({suggestions.length})
          </button>
          <button
            onClick={() => setActiveInsightTab('stats')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeInsightTab === 'stats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Estatísticas
          </button>
        </div>

        {/* Conteúdo dos Insights */}
        <div className="space-y-4">
          {activeInsightTab === 'intent' && (
            <div className="space-y-4">
              {/* Intenção Detectada */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-blue-900">
                    Intenção: {intent.type === 'product' && '🛍️ Busca por Produto'}
                    {intent.type === 'recipe' && '👨‍🍳 Busca por Receita'}
                    {intent.type === 'promotion' && '🏷️ Busca por Promoções'}
                    {intent.type === 'price' && '💰 Comparação de Preços'}
                    {intent.type === 'category' && '📂 Busca por Categoria'}
                  </span>
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                    {Math.round(intent.confidence * 100)}% confiança
                  </span>
                </div>
                <div className="text-sm text-blue-700">
                  Palavras-chave: {intent.keywords.join(', ')}
                  {intent.context && (
                    <span className="ml-2">• Contexto: {intent.context.replace('_', ' ')}</span>
                  )}
                </div>
              </div>

              {/* Correções Aplicadas */}
              {corrections && corrections.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-green-900">Correções Aplicadas</span>
                  </div>
                  <div className="text-sm text-green-700">
                    {corrections.map((correction, index) => (
                      <span key={index} className="mr-2">"{correction}"</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Correspondências Semânticas */}
              {semanticMatches.length > 1 && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-purple-500" />
                    <span className="font-medium text-purple-900">Expansão Semântica</span>
                  </div>
                  <div className="text-sm text-purple-700">
                    Termos relacionados: {semanticMatches.slice(1).join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeInsightTab === 'suggestions' && (
            <div className="space-y-4">
              {/* Sugestões de Receitas */}
              {categorizedSuggestions.recipe.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-orange-500" />
                    Receitas e Ingredientes
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {categorizedSuggestions.recipe.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => onSuggestionClick(suggestion.text)}
                        className="text-left p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-orange-900">{suggestion.text}</span>
                          <ArrowRight className="w-3 h-3 text-orange-500" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sugestões Semânticas */}
              {categorizedSuggestions.semantic.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-500" />
                    Sugestões Inteligentes
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {categorizedSuggestions.semantic.slice(0, 4).map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => onSuggestionClick(suggestion.text)}
                        className="text-left p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-purple-900">{suggestion.text}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-purple-600">
                              {Math.round(suggestion.score * 100)}%
                            </span>
                            <ArrowRight className="w-3 h-3 text-purple-500" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Consultas Relacionadas */}
              {relatedQueries.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    Buscas Relacionadas
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {relatedQueries.map((query, index) => (
                      <button
                        key={index}
                        onClick={() => onSuggestionClick(query)}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeInsightTab === 'stats' && analysisData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Estatísticas Gerais */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">📊 Resultados</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total de produtos:</span>
                    <span className="font-medium">{analysisData.totalProducts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disponíveis:</span>
                    <span className="font-medium text-green-600">{analysisData.availableCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Em promoção:</span>
                    <span className="font-medium text-orange-600">{analysisData.promotionsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tempo de busca:</span>
                    <span className="font-medium">{processingTime}ms</span>
                  </div>
                </div>
              </div>

              {/* Análise de Preços */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">💰 Preços</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Menor preço:</span>
                    <span className="font-medium text-green-600">
                      {formatPrice(analysisData.priceRange.min)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maior preço:</span>
                    <span className="font-medium text-red-600">
                      {formatPrice(analysisData.priceRange.max)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Preço médio:</span>
                    <span className="font-medium">
                      {formatPrice(analysisData.avgPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Diversidade */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">🏷️ Diversidade</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Categorias:</span>
                    <span className="font-medium">{analysisData.categories.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Marcas:</span>
                    <span className="font-medium">{analysisData.brands.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Correspondências:</span>
                    <span className="font-medium">{totalMatches}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * ✅ COMPONENTE: RESULTADOS DOS PRODUTOS
   */
  const ProductResults = () => {
    if (products.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <div className="text-6xl mb-4">🤔</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum produto encontrado
          </h3>
          <p className="text-gray-600 mb-6">
            A IA não encontrou produtos que correspondam à sua busca.
          </p>
          
          {/* Sugestões quando não há resultados */}
          {suggestions.length > 0 && (
            <div className="max-w-md mx-auto">
              <p className="text-sm text-gray-500 mb-3">Que tal tentar estas sugestões?</p>
              <div className="space-y-2">
                {suggestions.slice(0, 3).map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => onSuggestionClick(suggestion.text)}
                    className="w-full p-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Header dos Resultados */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {products.length} produtos encontrados
            </h3>
            {analysisData && (
              <p className="text-sm text-gray-600">
                {analysisData.promotionsCount > 0 && (
                  <span className="text-green-600 mr-4">
                    🏷️ {analysisData.promotionsCount} em promoção
                  </span>
                )}
                💰 Preços de {formatPrice(analysisData.priceRange.min)} até {formatPrice(analysisData.priceRange.max)}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Zap className="w-4 h-4" />
            <span>Busca IA: {processingTime}ms</span>
          </div>
        </div>

        {/* Grid/Lista de Produtos */}
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'space-y-4'
        }`}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              viewMode={viewMode}
              onClick={onProductClick}
              onAddToList={onAddToList}
              formatPrice={formatPrice}
              showAIBadge={true} // Mostrar badge de resultado IA
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <SearchInsights />
      <ProductResults />
    </div>
  );
};

export default AISearchResults;