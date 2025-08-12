// services/advancedAnalyticsService.ts - ANALYTICS AVANÇADOS E BUSINESS INTELLIGENCE
import { loggingService } from './loggingService';
import { cacheService } from './cacheService';

interface AnalyticsEvent {
  id: string;
  timestamp: number;
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  userId?: string;
  sessionId: string;
  properties: Record<string, any>;
  context: {
    url: string;
    referrer: string;
    userAgent: string;
    screenResolution: string;
    viewport: string;
    language: string;
    timezone: string;
  };
}

interface UserProfile {
  userId: string;
  traits: {
    age?: number;
    gender?: string;
    location?: {
      city: string;
      state: string;
      country: string;
    };
    preferences: {
      categories: string[];
      brands: string[];
      priceRange: { min: number; max: number };
    };
    behavior: {
      avgSessionDuration: number;
      searchFrequency: number;
      purchaseIntent: 'high' | 'medium' | 'low';
      preferredShoppingTime: string;
    };
  };
  segments: string[];
  lastActivity: number;
  totalSessions: number;
  totalEvents: number;
}

interface BusinessMetrics {
  revenue: {
    total: number;
    byCategory: Record<string, number>;
    byTimeframe: Record<string, number>;
  };
  users: {
    active: number;
    new: number;
    returning: number;
    churn: number;
  };
  products: {
    mostViewed: Array<{ id: string; views: number; name: string }>;
    mostSearched: Array<{ query: string; count: number }>;
    trending: Array<{ id: string; trend: number; name: string }>;
  };
  conversion: {
    searchToView: number;
    viewToList: number;
    listToPurchase: number;
  };
}

interface AnalyticsConfig {
  enableTracking: boolean;
  enableAutoEvents: boolean;
  batchSize: number;
  flushInterval: number;
  enableUserProfiles: boolean;
  enableBusinessMetrics: boolean;
  maxEventsInMemory: number;
  debugMode: boolean;
}

class AdvancedAnalyticsService {
  private config: AnalyticsConfig = {
    enableTracking: true,
    enableAutoEvents: true,
    batchSize: 20,
    flushInterval: 30000, // 30 segundos
    enableUserProfiles: true,
    enableBusinessMetrics: true,
    maxEventsInMemory: 1000,
    debugMode: false
  };

  private eventQueue: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private userProfile?: UserProfile;
  private flushTimer?: NodeJS.Timeout;
  private pageStartTime: number = Date.now();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeService();
  }

  // ✅ RASTREAMENTO DE EVENTOS BÁSICOS
  track(
    event: string,
    properties?: Record<string, any>,
    context?: Partial<AnalyticsEvent['context']>
  ): void {
    if (!this.config.enableTracking) return;

    const analyticsEvent: AnalyticsEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      type: 'track',
      category: this.extractCategory(event),
      action: event,
      label: properties?.label,
      value: properties?.value,
      userId: this.userId,
      sessionId: this.sessionId,
      properties: properties || {},
      context: {
        ...this.getDefaultContext(),
        ...context
      }
    };

    this.addEvent(analyticsEvent);

    if (this.config.debugMode) {
      console.log('📊 Analytics Event:', analyticsEvent);
    }
  }

  // ✅ IDENTIFICAÇÃO DE USUÁRIO
  identify(userId: string, traits?: Record<string, any>): void {
    this.userId = userId;
    
    const identifyEvent: AnalyticsEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      type: 'identify',
      category: 'user',
      action: 'identify',
      userId,
      sessionId: this.sessionId,
      properties: traits || {},
      context: this.getDefaultContext()
    };

    this.addEvent(identifyEvent);

    // Atualizar perfil do usuário
    if (this.config.enableUserProfiles) {
      this.updateUserProfile(userId, traits);
    }

    loggingService.info('ANALYTICS', `Usuário identificado: ${userId}`);
  }

  // ✅ RASTREAMENTO DE PÁGINA
  page(
    name: string,
    category?: string,
    properties?: Record<string, any>
  ): void {
    const pageEvent: AnalyticsEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      type: 'page',
      category: category || 'page',
      action: 'view',
      label: name,
      userId: this.userId,
      sessionId: this.sessionId,
      properties: {
        page: name,
        category,
        duration: Date.now() - this.pageStartTime,
        ...properties
      },
      context: this.getDefaultContext()
    };

    this.addEvent(pageEvent);
    this.pageStartTime = Date.now();

    loggingService.debug('ANALYTICS', `Página visitada: ${name}`);
  }

  // ✅ EVENTOS ESPECÍFICOS DO PRECIVOX

  // Eventos de busca
  trackSearch(query: string, results: number, filters?: any): void {
    this.track('search_performed', {
      query,
      results_count: results,
      filters,
      has_results: results > 0,
      query_length: query.length,
      search_source: 'main_search'
    });
  }

  trackSearchResultClick(query: string, productId: string, position: number): void {
    this.track('search_result_clicked', {
      query,
      product_id: productId,
      position,
      click_through_rate: position / 10 // Assumindo 10 resultados por página
    });
  }

  // Eventos de produto
  trackProductView(productId: string, productName: string, category: string, price: number): void {
    this.track('product_viewed', {
      product_id: productId,
      product_name: productName,
      product_category: category,
      product_price: price,
      view_source: 'search_results'
    });
  }

  trackProductAddToList(productId: string, listId: string, quantity: number = 1): void {
    this.track('product_added_to_list', {
      product_id: productId,
      list_id: listId,
      quantity,
      action_source: 'product_page'
    });
  }

  // Eventos de lista de compras
  trackListCreated(listId: string, listName: string): void {
    this.track('list_created', {
      list_id: listId,
      list_name: listName,
      creation_method: 'manual'
    });
  }

  trackListShared(listId: string, shareMethod: string): void {
    this.track('list_shared', {
      list_id: listId,
      share_method: shareMethod,
      share_timestamp: Date.now()
    });
  }

  // Eventos de preços e economia
  trackPriceComparison(productId: string, stores: Array<{store: string, price: number}>): void {
    const prices = stores.map(s => s.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    this.track('price_comparison', {
      product_id: productId,
      stores_compared: stores.length,
      price_range: maxPrice - minPrice,
      min_price: minPrice,
      max_price: maxPrice,
      avg_price: avgPrice,
      potential_savings: maxPrice - minPrice
    });
  }

  trackSavingsCalculated(totalSavings: number, itemsCount: number): void {
    this.track('savings_calculated', {
      total_savings: totalSavings,
      items_count: itemsCount,
      avg_savings_per_item: totalSavings / itemsCount,
      savings_percentage: totalSavings / 100 // Placeholder - would need original price
    });
  }

  // Eventos de localização
  trackLocationUsage(city: string, accuracy: number): void {
    this.track('location_used', {
      city,
      accuracy,
      location_source: accuracy < 100 ? 'gps' : 'network'
    });
  }

  // Eventos de IA
  trackAISuggestion(suggestionType: string, accepted: boolean, context?: any): void {
    this.track('ai_suggestion_shown', {
      suggestion_type: suggestionType,
      accepted,
      context,
      response_time: Date.now() - this.pageStartTime
    });
  }

  // ✅ ANÁLISE DE COMPORTAMENTO DO USUÁRIO
  analyzeUserBehavior(): {
    sessionAnalysis: any;
    userSegment: string;
    purchaseIntent: 'high' | 'medium' | 'low';
    recommendations: string[];
  } {
    const recentEvents = this.eventQueue.slice(-50);
    
    // Análise da sessão atual
    const sessionAnalysis = {
      duration: Date.now() - this.pageStartTime,
      pagesViewed: recentEvents.filter(e => e.type === 'page').length,
      searchesPerformed: recentEvents.filter(e => e.action === 'search_performed').length,
      productsViewed: recentEvents.filter(e => e.action === 'product_viewed').length,
      listsCreated: recentEvents.filter(e => e.action === 'list_created').length,
      priceComparisons: recentEvents.filter(e => e.action === 'price_comparison').length
    };

    // Determinação do segmento
    let userSegment = 'casual_browser';
    if (sessionAnalysis.searchesPerformed > 5 && sessionAnalysis.productsViewed > 10) {
      userSegment = 'active_shopper';
    } else if (sessionAnalysis.priceComparisons > 3) {
      userSegment = 'price_conscious';
    } else if (sessionAnalysis.listsCreated > 0) {
      userSegment = 'list_maker';
    }

    // Intenção de compra
    let purchaseIntent: 'high' | 'medium' | 'low' = 'low';
    if (sessionAnalysis.listsCreated > 0 && sessionAnalysis.priceComparisons > 2) {
      purchaseIntent = 'high';
    } else if (sessionAnalysis.productsViewed > 5) {
      purchaseIntent = 'medium';
    }

    // Recomendações
    const recommendations: string[] = [];
    if (sessionAnalysis.searchesPerformed > 3 && sessionAnalysis.listsCreated === 0) {
      recommendations.push('Sugerir criação de lista de compras');
    }
    if (sessionAnalysis.productsViewed > 5 && sessionAnalysis.priceComparisons === 0) {
      recommendations.push('Mostrar comparação de preços');
    }
    if (purchaseIntent === 'high') {
      recommendations.push('Exibir ofertas personalizadas');
    }

    return {
      sessionAnalysis,
      userSegment,
      purchaseIntent,
      recommendations
    };
  }

  // ✅ MÉTRICAS DE NEGÓCIO
  async generateBusinessMetrics(): Promise<BusinessMetrics> {
    // Em produção, isso viria de uma API ou banco de dados
    const mockMetrics: BusinessMetrics = {
      revenue: {
        total: 0, // PRECIVOX é comparador, não vende diretamente
        byCategory: {},
        byTimeframe: {}
      },
      users: {
        active: await this.getActiveUsersCount(),
        new: await this.getNewUsersCount(),
        returning: await this.getReturningUsersCount(),
        churn: 0
      },
      products: {
        mostViewed: await this.getMostViewedProducts(),
        mostSearched: await this.getMostSearchedQueries(),
        trending: await this.getTrendingProducts()
      },
      conversion: {
        searchToView: await this.getConversionRate('search', 'product_viewed'),
        viewToList: await this.getConversionRate('product_viewed', 'product_added_to_list'),
        listToPurchase: 0 // Não trackamos compras diretas
      }
    };

    // Cache metrics por 1 hora
    cacheService.cacheAnalytics('business_metrics', mockMetrics);
    
    return mockMetrics;
  }

  // ✅ RELATÓRIOS PERSONALIZADOS
  generateCustomReport(
    startDate: Date,
    endDate: Date,
    metrics: string[]
  ): Promise<any> {
    return new Promise((resolve) => {
      // Filtrar eventos por período
      const filteredEvents = this.eventQueue.filter(event => 
        event.timestamp >= startDate.getTime() && 
        event.timestamp <= endDate.getTime()
      );

      const report: any = {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          totalEvents: filteredEvents.length
        },
        metrics: {}
      };

      // Calcular métricas solicitadas
      metrics.forEach(metric => {
        switch (metric) {
          case 'page_views':
            report.metrics.page_views = filteredEvents.filter(e => e.type === 'page').length;
            break;
          case 'searches':
            report.metrics.searches = filteredEvents.filter(e => e.action === 'search_performed').length;
            break;
          case 'product_views':
            report.metrics.product_views = filteredEvents.filter(e => e.action === 'product_viewed').length;
            break;
          case 'unique_users':
            report.metrics.unique_users = new Set(filteredEvents.map(e => e.userId).filter(Boolean)).size;
            break;
          case 'avg_session_duration':
            // Simplified calculation
            report.metrics.avg_session_duration = 5 * 60 * 1000; // 5 minutes placeholder
            break;
        }
      });

      resolve(report);
    });
  }

  // ✅ EXPORTAÇÃO DE DADOS
  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      session: {
        id: this.sessionId,
        userId: this.userId,
        startTime: this.pageStartTime,
        events: this.eventQueue.length
      },
      events: this.eventQueue,
      userProfile: this.userProfile,
      generatedAt: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Simplified CSV export
      const headers = ['timestamp', 'type', 'category', 'action', 'userId', 'properties'];
      const csvRows = [headers.join(',')];
      
      this.eventQueue.forEach(event => {
        const row = [
          event.timestamp,
          event.type,
          event.category,
          event.action,
          event.userId || '',
          JSON.stringify(event.properties).replace(/,/g, ';')
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    }
  }

  // ✅ FUNNEL ANALYSIS
  analyzeFunnel(steps: string[]): {
    step: string;
    count: number;
    conversionRate: number;
  }[] {
    const funnelData = steps.map((step, index) => {
      const count = this.eventQueue.filter(e => e.action === step).length;
      const previousCount = index === 0 ? this.eventQueue.length : 
        this.eventQueue.filter(e => e.action === steps[index - 1]).length;
      
      return {
        step,
        count,
        conversionRate: previousCount > 0 ? (count / previousCount) * 100 : 0
      };
    });

    return funnelData;
  }

  // ✅ MÉTODOS PRIVADOS
  private addEvent(event: AnalyticsEvent): void {
    this.eventQueue.push(event);

    // Limitar eventos em memória
    if (this.eventQueue.length > this.config.maxEventsInMemory) {
      this.eventQueue = this.eventQueue.slice(-this.config.maxEventsInMemory);
    }

    // Auto flush se batch está cheio
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Salvar localmente
      const existingEvents = JSON.parse(localStorage.getItem('precivox_analytics') || '[]');
      const allEvents = [...existingEvents, ...eventsToFlush].slice(-10000); // Manter apenas últimos 10k
      localStorage.setItem('precivox_analytics', JSON.stringify(allEvents));

      // Enviar para servidor (se disponível)
      // await this.sendToServer(eventsToFlush);

      loggingService.debug('ANALYTICS', `${eventsToFlush.length} eventos processados`);
    } catch (error) {
      loggingService.error('ANALYTICS', 'Erro ao processar eventos', error);
      // Recolocar eventos na fila em caso de erro
      this.eventQueue.unshift(...eventsToFlush);
    }
  }

  private updateUserProfile(userId: string, traits?: Record<string, any>): void {
    // Implementação simplificada - em produção viria de API
    this.userProfile = {
      userId,
      traits: {
        ...traits
      } as any,
      segments: [],
      lastActivity: Date.now(),
      totalSessions: 1,
      totalEvents: this.eventQueue.filter(e => e.userId === userId).length
    };
  }

  private initializeService(): void {
    this.startFlushTimer();
    
    if (this.config.enableAutoEvents) {
      this.setupAutoEvents();
    }

    loggingService.info('ANALYTICS', 'Serviço de analytics avançados inicializado');
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private setupAutoEvents(): void {
    // Page views automáticos
    window.addEventListener('hashchange', () => {
      const page = window.location.hash.replace('#', '') || 'home';
      this.page(page);
    });

    // Unload event
    window.addEventListener('beforeunload', () => {
      this.track('session_ended', {
        duration: Date.now() - this.pageStartTime,
        total_events: this.eventQueue.length
      });
      this.flush();
    });
  }

  private getDefaultContext(): AnalyticsEvent['context'] {
    return {
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractCategory(event: string): string {
    if (event.includes('search')) return 'search';
    if (event.includes('product')) return 'product';
    if (event.includes('list')) return 'list';
    if (event.includes('user')) return 'user';
    return 'general';
  }

  // Mock methods for business metrics (em produção viriam de APIs)
  private async getActiveUsersCount(): Promise<number> { return 1250; }
  private async getNewUsersCount(): Promise<number> { return 89; }
  private async getReturningUsersCount(): Promise<number> { return 1161; }
  private async getMostViewedProducts(): Promise<any[]> { return []; }
  private async getMostSearchedQueries(): Promise<any[]> { return []; }
  private async getTrendingProducts(): Promise<any[]> { return []; }
  private async getConversionRate(from: string, to: string): Promise<number> { return 0.12; }

  // ✅ CONFIGURAÇÃO
  configure(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.flushInterval && this.flushTimer) {
      clearInterval(this.flushTimer);
      this.startFlushTimer();
    }

    loggingService.info('ANALYTICS', 'Configuração atualizada', newConfig);
  }

  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }
}

// ✅ INSTANCE SINGLETON
export const advancedAnalyticsService = new AdvancedAnalyticsService();

// ✅ HOOK PARA USO EM COMPONENTES
export const useAdvancedAnalytics = () => {
  return {
    // Eventos básicos
    track: (event: string, properties?: Record<string, any>) =>
      advancedAnalyticsService.track(event, properties),
    identify: (userId: string, traits?: Record<string, any>) =>
      advancedAnalyticsService.identify(userId, traits),
    page: (name: string, category?: string, properties?: Record<string, any>) =>
      advancedAnalyticsService.page(name, category, properties),

    // Eventos específicos
    trackSearch: (query: string, results: number, filters?: any) =>
      advancedAnalyticsService.trackSearch(query, results, filters),
    trackProductView: (productId: string, productName: string, category: string, price: number) =>
      advancedAnalyticsService.trackProductView(productId, productName, category, price),
    trackProductAddToList: (productId: string, listId: string, quantity?: number) =>
      advancedAnalyticsService.trackProductAddToList(productId, listId, quantity),
    trackPriceComparison: (productId: string, stores: Array<{store: string, price: number}>) =>
      advancedAnalyticsService.trackPriceComparison(productId, stores),

    // Análises
    analyzeUserBehavior: () => advancedAnalyticsService.analyzeUserBehavior(),
    generateBusinessMetrics: () => advancedAnalyticsService.generateBusinessMetrics(),
    generateCustomReport: (startDate: Date, endDate: Date, metrics: string[]) =>
      advancedAnalyticsService.generateCustomReport(startDate, endDate, metrics),
    analyzeFunnel: (steps: string[]) => advancedAnalyticsService.analyzeFunnel(steps),

    // Utilitários
    exportData: (format?: 'json' | 'csv') => advancedAnalyticsService.exportData(format),
    configure: (config: Partial<AnalyticsConfig>) => advancedAnalyticsService.configure(config)
  };
};

export default advancedAnalyticsService;