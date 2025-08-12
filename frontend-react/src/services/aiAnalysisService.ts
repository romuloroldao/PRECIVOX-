// services/aiAnalysisService.ts
// Serviço para análises AI reais da lista de compras

interface Product {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  loja: string;
  marca?: string;
  promocao?: {
    desconto: number;
    precoOriginal: number;
    validoAte: string;
  };
  disponivel?: boolean;
  estoque?: number;
  distancia?: number;
}

interface ListItem {
  produto: Product;
  quantidade: number;
}

interface AIAnalysisRequest {
  listItems: ListItem[];
  userLocation?: {
    lat: number;
    lng: number;
  };
  userPreferences?: {
    priceWeight: number; // 0-1, peso dado ao preço vs qualidade
    distanceWeight: number; // 0-1, peso dado à distância
    brandPreferences: string[]; // marcas preferidas
    budgetLimit?: number; // limite de orçamento
  };
}

interface AIAnalysisResponse {
  analysis: {
    totalCost: number;
    estimatedSavings: number;
    efficiencyScore: number; // 0-100
    routeOptimization: {
      currentRoute: string[];
      optimizedRoute: string[];
      timeSaved: number; // em minutos
      fuelSaved: number; // em reais
    };
    insights: string[];
    warnings: string[];
  };
  suggestions: AISuggestion[];
  alternatives: ProductAlternative[];
  marketAnalysis: MarketAnalysis[];
}

interface AISuggestion {
  id: string;
  type: 'price_optimization' | 'quantity_adjustment' | 'store_change' | 'product_substitute' | 'route_optimization';
  title: string;
  description: string;
  impact: {
    savings: number;
    timeReduction?: number;
    qualityImpact?: 'positive' | 'neutral' | 'negative';
  };
  confidence: number; // 0-1
  actionable: boolean;
  action?: {
    type: string;
    parameters: any;
  };
}

interface ProductAlternative {
  originalProduct: Product;
  alternatives: Array<{
    product: Product;
    reasonForSuggestion: string;
    priceDifference: number;
    qualityComparison: 'better' | 'similar' | 'lower';
    availability: boolean;
  }>;
}

interface MarketAnalysis {
  store: string;
  items: ListItem[];
  totalCost: number;
  distance: number;
  estimatedTime: number;
  pros: string[];
  cons: string[];
  recommendation: 'highly_recommended' | 'recommended' | 'acceptable' | 'avoid';
}

class AIAnalysisService {
  private apiUrl: string;
  private apiKey?: string;

  constructor() {
    // Detectar ambiente (desenvolvimento/produção)
    this.apiUrl = this.getApiUrl();
    this.apiKey = this.getApiKey();
  }

  private getApiUrl(): string {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return '/api/ai'; // Usar proxy em produção
      }
    }
    
    return 'http://localhost:3001/api/ai'; // Backend local
  }

  private getApiKey(): string | undefined {
    return import.meta.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
  }

  /**
   * Realiza análise AI completa da lista de compras
   */
  async analyzeShoppingList(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    console.log('🧠 AIAnalysisService - Iniciando análise da lista...');
    console.log('📋 Lista com', request.listItems.length, 'itens');

    try {
      const response = await fetch(`${this.apiUrl}/analyze-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          ...request,
          timestamp: new Date().toISOString(),
          sessionId: this.generateSessionId()
        })
      });

      if (!response.ok) {
        throw new Error(`AI Analysis API error: ${response.status} ${response.statusText}`);
      }

      const analysisResult = await response.json();
      
      console.log('✅ Análise AI concluída:', {
        suggestions: analysisResult.suggestions?.length || 0,
        savings: analysisResult.analysis?.estimatedSavings || 0,
        efficiency: analysisResult.analysis?.efficiencyScore || 0
      });

      return analysisResult;

    } catch (error) {
      console.error('❌ Erro na análise AI:', error);
      
      // Fallback para análise local/mock em caso de erro
      return this.generateFallbackAnalysis(request);
    }
  }

  /**
   * Solicita sugestões específicas para um produto
   */
  async getProductSuggestions(product: Product, context: ListItem[]): Promise<ProductAlternative> {
    console.log('🔍 Buscando alternativas para:', product.nome);

    try {
      const response = await fetch(`${this.apiUrl}/product-alternatives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          product,
          context: context.map(item => ({ produto: item.produto, quantidade: item.quantidade })),
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Product suggestions API error: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('❌ Erro ao buscar alternativas:', error);
      
      // Retornar alternativa vazia em caso de erro
      return {
        originalProduct: product,
        alternatives: []
      };
    }
  }

  /**
   * Otimiza a rota de compras usando IA
   */
  async optimizeRoute(items: ListItem[], userLocation?: { lat: number; lng: number }): Promise<{
    optimizedRoute: MarketAnalysis[];
    savings: { time: number; fuel: number };
    confidence: number;
  }> {
    console.log('🗺️ Otimizando rota de compras...');

    try {
      const response = await fetch(`${this.apiUrl}/optimize-route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          items,
          userLocation,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Route optimization API error: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('❌ Erro na otimização de rota:', error);
      
      // Fallback básico
      return {
        optimizedRoute: [],
        savings: { time: 0, fuel: 0 },
        confidence: 0
      };
    }
  }

  /**
   * Análise fallback quando a API não está disponível
   */
  private generateFallbackAnalysis(request: AIAnalysisRequest): AIAnalysisResponse {
    console.log('⚠️ Usando análise fallback (offline)');

    const totalCost = request.listItems.reduce((sum, item) => 
      sum + (item.produto.preco * item.quantidade), 0
    );

    return {
      analysis: {
        totalCost,
        estimatedSavings: totalCost * 0.1, // 10% de economia estimada
        efficiencyScore: 75,
        routeOptimization: {
          currentRoute: [],
          optimizedRoute: [],
          timeSaved: 0,
          fuelSaved: 0
        },
        insights: [
          'Análise offline: Esta é uma análise básica. Conecte-se à internet para análise AI completa.',
          `Lista com ${request.listItems.length} itens no valor total de R$ ${totalCost.toFixed(2)}`
        ],
        warnings: ['Funcionalidade AI limitada - offline']
      },
      suggestions: [],
      alternatives: [],
      marketAnalysis: []
    };
  }

  /**
   * Gera ID único para a sessão
   */
  private generateSessionId(): string {
    return `ai_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Verifica se o serviço AI está disponível
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.warn('⚠️ Serviço AI não disponível:', error);
      return false;
    }
  }
}

// ✅ SINGLETON EXPORT
export const aiAnalysisService = new AIAnalysisService();
export default aiAnalysisService;

// ✅ EXPORT TYPES
export type {
  AIAnalysisRequest,
  AIAnalysisResponse,
  AISuggestion,
  ProductAlternative,
  MarketAnalysis
};