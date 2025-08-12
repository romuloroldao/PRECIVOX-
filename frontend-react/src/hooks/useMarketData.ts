// useMarketData.ts - HOOK PARA DADOS FILTRADOS POR MERCADO
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth, usePermissions } from './useAuth';
import { useLocation } from './useLocation';
import { MarketDataFilter } from '../services/marketDataFilter';

interface MarketDataState {
  products: any[];
  analytics: any;
  users: any[];
  sales: any[];
  markets?: any[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

interface UseMarketDataReturn {
  data: MarketDataState;
  filteredData: any;
  canAccessMarket: (marketId: string) => boolean;
  refreshData: () => Promise<void>;
  filterByMarket: (marketId: string) => any;
  isDataVisible: (dataType: string) => boolean;
}

export const useMarketData = (): UseMarketDataReturn => {
  const { user } = useAuth();
  const { getMarketId, canAccessMarket: checkMarketAccess } = usePermissions();
  const { location } = useLocation();

  const [rawData, setRawData] = useState<any>({
    products: [],
    analytics: {},
    users: [],
    sales: [],
    markets: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // ✅ DADOS FILTRADOS BASEADOS NO USUÁRIO
  const filteredData = useMemo(() => {
    console.log('🔄 Aplicando filtro de dados para usuário:', user?.role, user?.marketId);
    
    // Log de auditoria
    MarketDataFilter.logDataAccess(user, 'dashboard_data', {
      userMarketId: user?.marketId,
      location: location?.city
    });

    // Filtrar por role
    let filtered = MarketDataFilter.filterDataByUserRole(rawData, user);
    
    // Filtrar por localização se disponível
    if (location) {
      filtered = MarketDataFilter.filterByLocation(filtered, {
        city: location.city || '',
        state: location.state || ''
      });
    }

    // Sanitizar dados sensíveis
    filtered = MarketDataFilter.sanitizeData(filtered, user);

    console.log('✅ Dados filtrados:', {
      products: filtered.products?.length || 0,
      hasAnalytics: !!filtered.analytics,
      users: filtered.users?.length || 0,
      sales: filtered.sales?.length || 0
    });

    return filtered;
  }, [rawData, user, location]);

  // ✅ ESTADO PROCESSADO
  const data: MarketDataState = useMemo(() => ({
    products: filteredData.products || [],
    analytics: filteredData.analytics || {},
    users: filteredData.users || [],
    sales: filteredData.sales || [],
    markets: filteredData.markets || [],
    loading,
    error,
    lastUpdate
  }), [filteredData, loading, error, lastUpdate]);

  // ✅ CARREGAR DADOS INICIAIS
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📡 Carregando dados do mercado...');

      // Simular dados enquanto APIs não estão disponíveis
      const mockData = {
        products: [
          {
            id: 'prod-001',
            nome: 'Arroz Branco 5kg',
            preco: 15.90,
            marketId: 'market-001',
            lojaId: 'market-001',
            categoria: 'Grãos',
            disponivel: true,
            location: { city: 'Franco da Rocha', state: 'SP' }
          },
          {
            id: 'prod-002',
            nome: 'Feijão Preto 1kg',
            preco: 8.50,
            marketId: 'market-001',
            lojaId: 'market-001',
            categoria: 'Grãos',
            disponivel: true,
            location: { city: 'Franco da Rocha', state: 'SP' }
          },
          {
            id: 'prod-003',
            nome: 'Açúcar Cristal 1kg',
            preco: 4.20,
            marketId: 'market-002',
            lojaId: 'market-002',
            categoria: 'Açúcares',
            disponivel: true,
            location: { city: 'São Paulo', state: 'SP' }
          }
        ],
        analytics: {
          salesByMarket: {
            'market-001': {
              total: 125430.50,
              daily: [1200, 1350, 980, 1450, 1100],
              averageTicket: 85.20
            },
            'market-002': {
              total: 98750.30,
              daily: [900, 1100, 850, 1200, 950],
              averageTicket: 72.15
            }
          },
          productsByMarket: {
            'market-001': {
              top: [
                { name: 'Arroz Branco 5kg', sales: 245 },
                { name: 'Feijão Preto 1kg', sales: 189 }
              ]
            }
          },
          customersByMarket: {
            'market-001': { count: 156 },
            'market-002': { count: 98 }
          },
          conversionByMarket: {
            'market-001': 24.7,
            'market-002': 18.3
          }
        },
        users: [
          {
            id: 'user-001',
            name: 'João Silva',
            marketId: 'market-001',
            role: 'cliente',
            email: 'joao@email.com'
          },
          {
            id: 'user-002',
            name: 'Maria Santos',
            marketId: 'market-001',
            role: 'cliente',
            email: 'maria@email.com'
          }
        ],
        sales: [
          {
            id: 'sale-001',
            marketId: 'market-001',
            valor: 85.20,
            data: '2024-01-29',
            produtos: ['prod-001', 'prod-002']
          }
        ],
        markets: [
          {
            id: 'market-001',
            name: 'Supermercado Vila Nova',
            city: 'Franco da Rocha',
            state: 'SP',
            status: 'active'
          },
          {
            id: 'market-002',
            name: 'Mercado Central',
            city: 'São Paulo',
            state: 'SP',
            status: 'active'
          }
        ]
      };

      // Em produção, substituir por chamadas reais de API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay de rede
      
      setRawData(mockData);
      setLastUpdate(new Date());

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(errorMessage);
      console.error('❌ Erro ao carregar dados do mercado:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ REFRESH MANUAL
  const refreshData = useCallback(async () => {
    console.log('🔄 Atualizando dados do mercado...');
    await loadData();
  }, [loadData]);

  // ✅ FILTRAR POR MERCADO ESPECÍFICO
  const filterByMarket = useCallback((marketId: string) => {
    if (!MarketDataFilter.canAccessMarketData(user, marketId)) {
      console.warn(`🚫 Usuário ${user?.role} não pode acessar dados do mercado ${marketId}`);
      return null;
    }

    return MarketDataFilter.filterDataByUserRole({
      ...rawData,
      products: rawData.products?.filter((p: any) => 
        p.marketId === marketId || p.lojaId === marketId
      ),
      sales: rawData.sales?.filter((s: any) => 
        s.marketId === marketId
      )
    }, user);
  }, [rawData, user]);

  // ✅ VERIFICAR VISIBILIDADE DE DADOS
  const isDataVisible = useCallback((dataType: string): boolean => {
    if (!user) return false;

    const visibilityMatrix = {
      'products': ['cliente', 'gestor', 'admin'],
      'analytics': ['gestor', 'admin'],
      'users': ['gestor', 'admin'],
      'sales': ['gestor', 'admin'],
      'markets': ['admin'],
      'personal_lists': ['cliente'],
      'favorites': ['cliente']
    };

    return visibilityMatrix[dataType as keyof typeof visibilityMatrix]?.includes(user.role) || false;
  }, [user]);

  // ✅ VERIFICAR ACESSO A MERCADO
  const canAccessMarket = useCallback((marketId: string): boolean => {
    return MarketDataFilter.canAccessMarketData(user, marketId);
  }, [user]);

  // ✅ CARREGAR DADOS NA INICIALIZAÇÃO
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    filteredData,
    canAccessMarket,
    refreshData,
    filterByMarket,
    isDataVisible
  };
};

export default useMarketData;