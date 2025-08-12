// services/aiSearchService.ts - SISTEMA DE BUSCA AVANÇADA COM IA
import { Product } from '../types/product';
import { searchProducts, generateSmartSuggestions } from '../utils/searchUtils';

// ✅ TIPOS PARA IA DE BUSCA
export interface AISearchIntent {
  type: 'product' | 'category' | 'brand' | 'price' | 'promotion' | 'recipe' | 'comparison' | 'list';
  confidence: number;
  keywords: string[];
  filters?: {
    priceRange?: [number, number];
    category?: string;
    brand?: string;
    onPromotion?: boolean;
    location?: string;
  };
  context?: string;
}

export interface AISearchSuggestion {
  id: string;
  text: string;
  type: 'semantic' | 'corrected' | 'related' | 'trending' | 'recipe' | 'comparison';
  score: number;
  intent?: AISearchIntent;
  metadata?: {
    category?: string;
    productCount?: number;
    avgPrice?: number;
    relatedTerms?: string[];
  };
}

export interface AISearchResult {
  products: Product[];
  intent: AISearchIntent;
  suggestions: AISearchSuggestion[];
  corrections?: string[];
  relatedQueries: string[];
  semanticMatches: string[];
  totalMatches: number;
  processingTime: number;
}

// ✅ MAPEAMENTOS SEMÂNTICOS AVANÇADOS
const SEMANTIC_CATEGORIES = {
  // Situações e contextos
  'cafe_da_manha': ['leite', 'pao', 'manteiga', 'cafe', 'cereal', 'iogurte', 'fruta'],
  'almoco': ['arroz', 'feijao', 'carne', 'verdura', 'legume', 'salada'],
  'jantar': ['sopa', 'pao', 'queijo', 'embutido', 'lanche'],
  'churrasco': ['carne', 'linguica', 'cerveja', 'carvao', 'sal grosso'],
  'festa': ['refrigerante', 'salgadinho', 'doce', 'cerveja', 'guarana'],
  'dieta': ['light', 'zero', 'integral', 'organico', 'natural'],
  'bebe': ['fralda', 'leite po', 'papinha', 'shampoo bebe'],
  
  // Ocasiões especiais
  'natal': ['peru', 'chester', 'panetone', 'champagne', 'nozes'],
  'pascoa': ['chocolate', 'ovos', 'bacalhau', 'colomba'],
  'festa_junina': ['milho', 'amendoim', 'quentao', 'pipoca'],
  
  // Tipos de refeição
  'lanche': ['biscoito', 'bolacha', 'chocolate', 'suco', 'sanduiche'],
  'sobremesa': ['sorvete', 'pudim', 'chocolate', 'doce', 'fruta'],
  
  // Cuidados específicos
  'diabetico': ['diet', 'sem acucar', 'adocante', 'integral'],
  'vegano': ['vegetal', 'soja', 'quinoa', 'amaranto', 'castanha'],
  'vegetariano': ['verdura', 'legume', 'queijo', 'ovo', 'leite'],
  
  // Limpeza por ambiente
  'cozinha': ['detergente', 'esponja', 'pano', 'desengordurante'],
  'banheiro': ['desinfetante', 'papel higienico', 'sabonete'],
  'roupa': ['sabao po', 'amaciante', 'alvejante'],
};

const RECIPE_SUGGESTIONS = {
  'bolo': ['farinha', 'ovo', 'acucar', 'leite', 'fermento'],
  'brigadeiro': ['leite condensado', 'chocolate po', 'manteiga', 'granulado'],
  'feijoada': ['feijao preto', 'linguica', 'bacon', 'carne seca'],
  'lasanha': ['massa lasanha', 'queijo', 'molho tomate', 'carne moida'],
  'pao': ['farinha', 'fermento', 'sal', 'agua', 'oleo'],
  'pizza': ['farinha', 'queijo', 'molho tomate', 'calabresa'],
  'salada': ['alface', 'tomate', 'cebola', 'azeite', 'vinagre'],
  'sopa': ['legume', 'carne', 'caldo', 'batata', 'cenoura'],
};

const BRAND_CORRECTIONS = {
  'cocacola': 'coca cola',
  'nestle': 'nestlé',
  'kibon': 'kibom',
  'brahma': 'brahma',
  'skol': 'skol',
  'guarana': 'guaraná',
  'acucar': 'açúcar',
};

const COMMON_MISSPELLINGS = {
  'acucar': 'açúcar',
  'cafe': 'café',
  'pao': 'pão',
  'sabao': 'sabão',
  'macarrao': 'macarrão',
  'feijao': 'feijão',
  'guarana': 'guaraná',
  'limao': 'limão',
  'mamao': 'mamão',
  'detergente': 'detergente',
  'shampoo': 'xampu',
};

class AISearchService {
  private static instance: AISearchService;
  private searchHistory: string[] = [];
  private trendingQueries: Map<string, number> = new Map();
  
  static getInstance(): AISearchService {
    if (!AISearchService.instance) {
      AISearchService.instance = new AISearchService();
    }
    return AISearchService.instance;
  }

  /**
   * ✅ FUNÇÃO PRINCIPAL DE BUSCA COM IA
   */
  async performAISearch(
    query: string, 
    products: Product[], 
    options: {
      includeSemanticSearch?: boolean;
      includeRecipeSuggestions?: boolean;
      includeCorrections?: boolean;
      maxSuggestions?: number;
    } = {}
  ): Promise<AISearchResult> {
    const startTime = Date.now();
    
    const {
      includeSemanticSearch = true,
      includeRecipeSuggestions = true,
      includeCorrections = true,
      maxSuggestions = 10
    } = options;

    console.log('🧠 AI Search iniciando para:', query);
    
    // 1. Analisar intenção da busca
    const intent = this.analyzeSearchIntent(query);
    console.log('🎯 Intenção detectada:', intent);
    
    // 2. Correções ortográficas
    const correctedQuery = includeCorrections ? this.correctSpelling(query) : query;
    const corrections = correctedQuery !== query ? [correctedQuery] : [];
    
    // 3. Expandir busca semanticamente
    const semanticTerms = includeSemanticSearch ? this.expandSemantically(correctedQuery) : [correctedQuery];
    console.log('🔍 Termos semânticos:', semanticTerms);
    
    // 4. Buscar produtos com termos expandidos
    let searchResults: Product[] = [];
    const allMatches = new Set<string>();
    
    for (const term of semanticTerms) {
      const results = searchProducts(products, term);
      results.forEach(product => {
        if (!searchResults.find(p => p.id === product.id)) {
          searchResults.push(product);
        }
        allMatches.add(product.id);
      });
    }
    
    // 5. Aplicar filtros baseados na intenção
    searchResults = this.applyIntentFilters(searchResults, intent);
    
    // 6. Gerar sugestões avançadas
    const suggestions = await this.generateAISuggestions(
      query, 
      intent, 
      products, 
      { 
        includeRecipeSuggestions, 
        maxSuggestions 
      }
    );
    
    // 7. Gerar consultas relacionadas
    const relatedQueries = this.generateRelatedQueries(query, intent);
    
    // 8. Registrar busca para aprendizado
    this.recordSearch(query);
    
    const processingTime = Date.now() - startTime;
    
    const result: AISearchResult = {
      products: searchResults,
      intent,
      suggestions,
      corrections,
      relatedQueries,
      semanticMatches: semanticTerms,
      totalMatches: allMatches.size,
      processingTime
    };
    
    console.log('✅ AI Search concluída:', {
      resultsCount: searchResults.length,
      suggestionsCount: suggestions.length,
      processingTime: `${processingTime}ms`
    });
    
    return result;
  }

  /**
   * ✅ ANÁLISE DE INTENÇÃO DA BUSCA
   */
  private analyzeSearchIntent(query: string): AISearchIntent {
    const normalizedQuery = query.toLowerCase().trim();
    const words = normalizedQuery.split(/\s+/);
    
    // Detectar intenção por padrões
    let type: AISearchIntent['type'] = 'product';
    let confidence = 0.5;
    const keywords: string[] = [];
    const filters: AISearchIntent['filters'] = {};
    let context = '';
    
    // Intenção de preço
    if (/\b(barato|caro|preço|valor|custo|até|menor|maior|entre)\b/.test(normalizedQuery)) {
      type = 'price';
      confidence = 0.8;
      
      // Extrair faixas de preço
      const priceMatch = normalizedQuery.match(/(\d+(?:\.\d+)?)\s*(?:até|a|-)\s*(\d+(?:\.\d+)?)/);
      if (priceMatch) {
        filters.priceRange = [parseFloat(priceMatch[1]), parseFloat(priceMatch[2])];
        confidence = 0.9;
      }
    }
    
    // Intenção de promoção
    if (/\b(promoção|oferta|desconto|liquidação|saldão|barato)\b/.test(normalizedQuery)) {
      type = 'promotion';
      filters.onPromotion = true;
      confidence = 0.9;
    }
    
    // Intenção de categoria
    if (/\b(categoria|tipo|seção|departamento)\b/.test(normalizedQuery)) {
      type = 'category';
      confidence = 0.8;
    }
    
    // Intenção de marca
    if (/\b(marca|fabricante)\b/.test(normalizedQuery)) {
      type = 'brand';
      confidence = 0.8;
    }
    
    // Intenção de receita
    if (/\b(receita|como fazer|ingredientes|para fazer)\b/.test(normalizedQuery)) {
      type = 'recipe';
      confidence = 0.9;
      context = 'recipe_search';
    }
    
    // Intenção de comparação
    if (/\b(comparar|vs|versus|ou|melhor|diferença)\b/.test(normalizedQuery)) {
      type = 'comparison';
      confidence = 0.8;
    }
    
    // Intenção de lista
    if (/\b(lista|compras|carrinho|cesta)\b/.test(normalizedQuery)) {
      type = 'list';
      confidence = 0.7;
    }
    
    // Detectar contexto semântico
    for (const [contextKey, contextItems] of Object.entries(SEMANTIC_CATEGORIES)) {
      if (contextItems.some(item => normalizedQuery.includes(item)) || 
          normalizedQuery.includes(contextKey.replace('_', ' '))) {
        context = contextKey;
        confidence = Math.max(confidence, 0.8);
        break;
      }
    }
    
    // Extrair palavras-chave relevantes
    words.forEach(word => {
      if (word.length > 2 && !/\b(de|da|do|em|na|no|com|para|por)\b/.test(word)) {
        keywords.push(word);
      }
    });
    
    return {
      type,
      confidence,
      keywords,
      filters,
      context
    };
  }

  /**
   * ✅ CORREÇÃO ORTOGRÁFICA
   */
  private correctSpelling(query: string): string {
    let corrected = query.toLowerCase();
    
    // Aplicar correções comuns
    for (const [wrong, right] of Object.entries(COMMON_MISSPELLINGS)) {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      corrected = corrected.replace(regex, right);
    }
    
    // Aplicar correções de marca
    for (const [wrong, right] of Object.entries(BRAND_CORRECTIONS)) {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      corrected = corrected.replace(regex, right);
    }
    
    return corrected;
  }

  /**
   * ✅ EXPANSÃO SEMÂNTICA
   */
  private expandSemantically(query: string): string[] {
    const terms = new Set([query]);
    const normalizedQuery = query.toLowerCase();
    
    // Adicionar termos do contexto semântico
    for (const [context, contextTerms] of Object.entries(SEMANTIC_CATEGORIES)) {
      if (normalizedQuery.includes(context.replace('_', ' ')) || 
          contextTerms.some(term => normalizedQuery.includes(term))) {
        contextTerms.forEach(term => {
          if (!normalizedQuery.includes(term)) {
            terms.add(`${query} ${term}`);
          }
        });
      }
    }
    
    // Adicionar variações de receitas
    for (const [recipe, ingredients] of Object.entries(RECIPE_SUGGESTIONS)) {
      if (normalizedQuery.includes(recipe)) {
        ingredients.forEach(ingredient => {
          terms.add(ingredient);
        });
      }
    }
    
    return Array.from(terms);
  }

  /**
   * ✅ APLICAR FILTROS BASEADOS NA INTENÇÃO
   */
  private applyIntentFilters(products: Product[], intent: AISearchIntent): Product[] {
    let filtered = [...products];
    
    if (intent.filters?.priceRange) {
      const [min, max] = intent.filters.priceRange;
      filtered = filtered.filter(p => p.preco >= min && p.preco <= max);
    }
    
    if (intent.filters?.onPromotion) {
      filtered = filtered.filter(p => p.promocao);
    }
    
    if (intent.filters?.category) {
      filtered = filtered.filter(p => 
        p.categoria.toLowerCase().includes(intent.filters!.category!.toLowerCase())
      );
    }
    
    if (intent.filters?.brand) {
      filtered = filtered.filter(p => 
        p.marca?.toLowerCase().includes(intent.filters!.brand!.toLowerCase())
      );
    }
    
    return filtered;
  }

  /**
   * ✅ GERAR SUGESTÕES COM IA
   */
  private async generateAISuggestions(
    query: string, 
    intent: AISearchIntent, 
    products: Product[],
    options: { includeRecipeSuggestions?: boolean; maxSuggestions?: number }
  ): Promise<AISearchSuggestion[]> {
    const suggestions: AISearchSuggestion[] = [];
    const normalizedQuery = query.toLowerCase();
    
    // 1. Sugestões semânticas baseadas no contexto
    if (intent.context && SEMANTIC_CATEGORIES[intent.context]) {
      const contextTerms = SEMANTIC_CATEGORIES[intent.context];
      contextTerms.forEach((term, index) => {
        if (!normalizedQuery.includes(term) && index < 3) {
          suggestions.push({
            id: `semantic-${term}`,
            text: term,
            type: 'semantic',
            score: 0.8 - (index * 0.1),
            metadata: {
              category: intent.context,
              relatedTerms: contextTerms.slice(0, 3)
            }
          });
        }
      });
    }
    
    // 2. Sugestões de receitas
    if (options.includeRecipeSuggestions && intent.type === 'recipe') {
      for (const [recipe, ingredients] of Object.entries(RECIPE_SUGGESTIONS)) {
        if (normalizedQuery.includes(recipe) || 
            ingredients.some(ing => normalizedQuery.includes(ing))) {
          suggestions.push({
            id: `recipe-${recipe}`,
            text: `Ingredientes para ${recipe}`,
            type: 'recipe',
            score: 0.9,
            metadata: {
              category: 'receitas',
              relatedTerms: ingredients
            }
          });
        }
      }
    }
    
    // 3. Correções ortográficas como sugestões
    const corrected = this.correctSpelling(query);
    if (corrected !== query) {
      suggestions.push({
        id: `corrected-${corrected}`,
        text: corrected,
        type: 'corrected',
        score: 0.95
      });
    }
    
    // 4. Sugestões baseadas em trending
    const trending = this.getTrendingSuggestions(query);
    trending.forEach((term, index) => {
      suggestions.push({
        id: `trending-${term}`,
        text: term,
        type: 'trending',
        score: 0.7 - (index * 0.05)
      });
    });
    
    // 5. Sugestões relacionadas dos produtos encontrados
    const productCategories = Array.from(new Set(products.map(p => p.categoria)));
    productCategories.slice(0, 3).forEach((category, index) => {
      if (!normalizedQuery.includes(category.toLowerCase())) {
        suggestions.push({
          id: `category-${category}`,
          text: category,
          type: 'related',
          score: 0.6 - (index * 0.1),
          metadata: {
            category,
            productCount: products.filter(p => p.categoria === category).length
          }
        });
      }
    });
    
    // Ordenar por score e limitar
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, options.maxSuggestions || 10);
  }

  /**
   * ✅ GERAR CONSULTAS RELACIONADAS
   */
  private generateRelatedQueries(query: string, intent: AISearchIntent): string[] {
    const related: string[] = [];
    const normalizedQuery = query.toLowerCase();
    
    // Baseado na intenção
    switch (intent.type) {
      case 'product':
        related.push(`${query} em promoção`, `${query} barato`, `marcas de ${query}`);
        break;
      case 'price':
        related.push(`${query} com desconto`, `ofertas ${query}`, `promoção ${query}`);
        break;
      case 'recipe':
        related.push(`ingredientes ${query}`, `como fazer ${query}`, `receita ${query}`);
        break;
      case 'category':
        related.push(`melhores ${query}`, `${query} em oferta`, `marcas ${query}`);
        break;
    }
    
    // Baseado no contexto
    if (intent.context && SEMANTIC_CATEGORIES[intent.context]) {
      const contextTerms = SEMANTIC_CATEGORIES[intent.context];
      related.push(
        `lista para ${intent.context.replace('_', ' ')}`,
        `produtos para ${intent.context.replace('_', ' ')}`,
        contextTerms.slice(0, 2).join(' + ')
      );
    }
    
    return related.slice(0, 5);
  }

  /**
   * ✅ OBTER SUGESTÕES TRENDING
   */
  private getTrendingSuggestions(query: string): string[] {
    // Mock de trending baseado em histórico simulado
    const trendingTerms = [
      'arroz', 'feijão', 'carne', 'frango', 'leite',
      'refrigerante', 'cerveja', 'chocolate', 'açúcar', 'café'
    ];
    
    return trendingTerms
      .filter(term => term.includes(query.toLowerCase()) || query.toLowerCase().includes(term))
      .slice(0, 3);
  }

  /**
   * ✅ REGISTRAR BUSCA PARA APRENDIZADO
   */
  private recordSearch(query: string): void {
    this.searchHistory.unshift(query);
    this.searchHistory = this.searchHistory.slice(0, 100); // Manter apenas últimas 100
    
    // Atualizar trending
    const count = this.trendingQueries.get(query) || 0;
    this.trendingQueries.set(query, count + 1);
  }

  /**
   * ✅ BUSCA INTELIGENTE COM AUTOCOMPLETE
   */
  async getSmartAutocomplete(
    query: string, 
    products: Product[],
    limit: number = 8
  ): Promise<AISearchSuggestion[]> {
    if (query.length < 2) {
      // Retornar sugestões populares
      return [
        { id: '1', text: 'arroz', type: 'trending', score: 1.0 },
        { id: '2', text: 'feijão', type: 'trending', score: 0.9 },
        { id: '3', text: 'carne', type: 'trending', score: 0.8 },
        { id: '4', text: 'leite', type: 'trending', score: 0.7 },
        { id: '5', text: 'pão', type: 'trending', score: 0.6 }
      ].slice(0, limit);
    }
    
    const suggestions: AISearchSuggestion[] = [];
    const normalizedQuery = query.toLowerCase();
    
    // Sugestões baseadas em produtos
    const productSuggestions = generateSmartSuggestions(products, query);
    productSuggestions.slice(0, limit / 2).forEach((suggestion, index) => {
      suggestions.push({
        id: `product-${index}`,
        text: suggestion,
        type: 'semantic',
        score: 0.9 - (index * 0.1)
      });
    });
    
    // Sugestões de correção
    const corrected = this.correctSpelling(query);
    if (corrected !== query) {
      suggestions.unshift({
        id: `corrected-${corrected}`,
        text: corrected,
        type: 'corrected',
        score: 1.0
      });
    }
    
    // Sugestões contextuais
    for (const [context, terms] of Object.entries(SEMANTIC_CATEGORIES)) {
      if (terms.some(term => term.startsWith(normalizedQuery))) {
        const matchingTerm = terms.find(term => term.startsWith(normalizedQuery));
        if (matchingTerm) {
          suggestions.push({
            id: `context-${matchingTerm}`,
            text: matchingTerm,
            type: 'semantic',
            score: 0.8,
            metadata: { category: context }
          });
        }
      }
    }
    
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * ✅ OBTER ESTATÍSTICAS DA BUSCA
   */
  getSearchStats() {
    return {
      totalSearches: this.searchHistory.length,
      uniqueQueries: new Set(this.searchHistory).size,
      topQueries: Array.from(this.trendingQueries.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([query, count]) => ({ query, count })),
      recentSearches: this.searchHistory.slice(0, 10)
    };
  }
}

// ✅ EXPORTAR INSTÂNCIA SINGLETON
export const aiSearchService = AISearchService.getInstance();
export default aiSearchService;