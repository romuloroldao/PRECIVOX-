// marketDataFilter.ts - SERVIÇO PARA FILTRAGEM DE DADOS POR MERCADO
import { UserProfile } from '../hooks/useAuth';

export interface MarketScopedData {
  products: any[];
  analytics: any;
  users: any[];
  sales: any[];
}

export class MarketDataFilter {
  
  /**
   * Filtra dados baseado no usuário e suas permissões
   */
  static filterDataByUserRole(data: any, user: UserProfile | null): any {
    if (!user) {
      return this.getPublicData(data);
    }

    switch (user.role) {
      case 'admin':
        return this.getAdminData(data);
      case 'gestor':
        return this.getGestorData(data, user.marketId);
      case 'cliente':
        return this.getClienteData(data, user.id);
      default:
        return this.getPublicData(data);
    }
  }

  /**
   * Dados públicos (usuários não autenticados)
   */
  private static getPublicData(data: any): any {
    return {
      products: data.products?.filter((p: any) => p.public === true) || [],
      analytics: null,
      users: [],
      sales: []
    };
  }

  /**
   * Dados completos para Administradores
   */
  private static getAdminData(data: any): any {
    return {
      products: data.products || [],
      analytics: data.analytics || {},
      users: data.users || [],
      sales: data.sales || [],
      markets: data.markets || [],
      systemStats: data.systemStats || {}
    };
  }

  /**
   * Dados filtrados por mercado para Gestores
   */
  private static getGestorData(data: any, marketId?: string): any {
    if (!marketId) {
      console.warn('Gestor sem marketId definido, aplicando filtro restritivo');
      return this.getPublicData(data);
    }

    console.log(`🏪 Filtrando dados para mercado: ${marketId}`);

    return {
      products: data.products?.filter((p: any) => 
        p.marketId === marketId || p.lojaId === marketId || p.storeId === marketId
      ) || [],
      analytics: this.filterAnalyticsByMarket(data.analytics, marketId),
      users: data.users?.filter((u: any) => 
        u.marketId === marketId || u.preferredMarkets?.includes(marketId)
      ) || [],
      sales: data.sales?.filter((s: any) => 
        s.marketId === marketId || s.storeId === marketId
      ) || [],
      market: data.markets?.find((m: any) => m.id === marketId) || null
    };
  }

  /**
   * Dados pessoais para Clientes
   */
  private static getClienteData(data: any, userId: string): any {
    return {
      products: data.products || [], // Clientes veem todos os produtos
      analytics: null, // Sem acesso a analytics
      users: [], // Sem acesso a outros usuários
      sales: [], // Sem acesso a dados de vendas
      personalLists: data.lists?.filter((l: any) => l.userId === userId) || [],
      favorites: data.favorites?.filter((f: any) => f.userId === userId) || [],
      purchases: data.purchases?.filter((p: any) => p.userId === userId) || []
    };
  }

  /**
   * Filtra analytics por mercado específico
   */
  private static filterAnalyticsByMarket(analytics: any, marketId: string): any {
    if (!analytics) return null;

    return {
      totalSales: analytics.salesByMarket?.[marketId]?.total || 0,
      dailySales: analytics.salesByMarket?.[marketId]?.daily || [],
      topProducts: analytics.productsByMarket?.[marketId]?.top || [],
      customerCount: analytics.customersByMarket?.[marketId]?.count || 0,
      averageTicket: analytics.salesByMarket?.[marketId]?.averageTicket || 0,
      conversionRate: analytics.conversionByMarket?.[marketId] || 0,
      // Manter algumas métricas globais para comparação (sem dados sensíveis)
      marketRanking: analytics.marketRankings?.find((r: any) => r.marketId === marketId)?.position || null,
      cityAverage: analytics.cityAverages || null
    };
  }

  /**
   * Verifica se o usuário pode acessar dados de um mercado específico
   */
  static canAccessMarketData(user: UserProfile | null, targetMarketId: string): boolean {
    if (!user) return false;

    switch (user.role) {
      case 'admin':
        return true; // Admin acessa qualquer mercado
      case 'gestor':
        return user.marketId === targetMarketId; // Gestor só acessa seu mercado
      case 'cliente':
        return false; // Cliente não acessa dados internos de mercados
      default:
        return false;
    }
  }

  /**
   * Sanitiza dados sensíveis baseado no papel do usuário
   */
  static sanitizeData(data: any, user: UserProfile | null): any {
    if (!user || user.role === 'cliente') {
      // Remove dados sensíveis para clientes ou usuários não autenticados
      return this.removeSensitiveData(data);
    }

    if (user.role === 'gestor') {
      // Gestores veem dados do próprio mercado, mas alguns dados globais são sanitizados
      return this.sanitizeForGestor(data, user.marketId);
    }

    // Admin vê tudo
    return data;
  }

  /**
   * Remove dados sensíveis
   */
  private static removeSensitiveData(data: any): any {
    const sanitized = { ...data };
    
    // Remover dados financeiros
    delete sanitized.revenue;
    delete sanitized.costs;
    delete sanitized.profit;
    delete sanitized.margins;
    
    // Remover dados pessoais de outros usuários
    delete sanitized.users;
    delete sanitized.customerData;
    
    // Remover dados operacionais internos
    delete sanitized.inventory;
    delete sanitized.suppliers;
    delete sanitized.contracts;
    
    return sanitized;
  }

  /**
   * Sanitiza dados para Gestor (mantém dados do próprio mercado)
   */
  private static sanitizeForGestor(data: any, marketId?: string): any {
    if (!marketId) return this.removeSensitiveData(data);

    const sanitized = { ...data };
    
    // Manter apenas dados do próprio mercado
    if (sanitized.revenue) {
      sanitized.revenue = sanitized.revenue[marketId] || 0;
    }
    
    if (sanitized.users) {
      sanitized.users = sanitized.users.filter((u: any) => u.marketId === marketId);
    }
    
    // Remover dados de outros mercados
    delete sanitized.globalRevenue;
    delete sanitized.competitorData;
    delete sanitized.systemStats;
    
    return sanitized;
  }

  /**
   * Aplica filtro de localização geográfica
   */
  static filterByLocation(data: any, userLocation?: { city: string; state: string }): any {
    if (!userLocation) return data;

    return {
      ...data,
      products: data.products?.filter((p: any) => {
        if (!p.location) return true; // Se não tem localização, mantém
        return p.location.city === userLocation.city && 
               p.location.state === userLocation.state;
      }),
      markets: data.markets?.filter((m: any) => {
        if (!m.location) return true;
        return m.location.city === userLocation.city && 
               m.location.state === userLocation.state;
      })
    };
  }

  /**
   * Logs de auditoria para acesso a dados
   */
  static logDataAccess(user: UserProfile | null, dataType: string, filters?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: user?.id || 'anonymous',
      userRole: user?.role || 'guest',
      marketId: user?.marketId || null,
      dataType,
      filters: filters || {},
      userAgent: navigator.userAgent
    };

    console.log('🔍 Data Access Log:', logEntry);
    
    // Em produção, enviar para serviço de auditoria
    if (process.env.NODE_ENV === 'production') {
      // analyticsService.logDataAccess(logEntry);
    }
  }
}

export default MarketDataFilter;