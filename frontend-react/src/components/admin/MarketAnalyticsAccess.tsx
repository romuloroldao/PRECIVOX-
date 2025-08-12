import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Eye,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  MapPin,
  Clock,
  Target,
  Zap,
  Star,
  Activity,
  PieChart,
  LineChart
} from 'lucide-react';

interface MarketAnalytics {
  marketId: string;
  marketName: string;
  location: string;
  period: string;
  metrics: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    userGrowth: number;
    totalSearches: number;
    searchGrowth: number;
    totalViews: number;
    viewsGrowth: number;
    conversionRate: number;
    avgSessionDuration: string;
    topProducts: Array<{
      name: string;
      views: number;
      searches: number;
    }>;
    topCategories: Array<{
      name: string;
      percentage: number;
    }>;
    hourlyActivity: Array<{
      hour: number;
      activity: number;
    }>;
  };
  lastUpdated: string;
}

const MarketAnalyticsAccess: React.FC = () => {
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'comparison'>('overview');

  const [analyticsData] = useState<MarketAnalytics[]>([
    {
      marketId: 'market-001',
      marketName: 'Supermercado Vila Nova',
      location: 'Franco da Rocha, SP',
      period: 'Últimos 30 dias',
      metrics: {
        totalUsers: 1247,
        activeUsers: 892,
        newUsers: 156,
        userGrowth: 12.5,
        totalSearches: 8945,
        searchGrowth: 18.3,
        totalViews: 24567,
        viewsGrowth: 15.7,
        conversionRate: 6.8,
        avgSessionDuration: '4m 32s',
        topProducts: [
          { name: 'Arroz Tio João 5kg', views: 1234, searches: 567 },
          { name: 'Feijão Carioca Camil 1kg', views: 987, searches: 432 },
          { name: 'Açúcar Cristal União 1kg', views: 765, searches: 321 }
        ],
        topCategories: [
          { name: 'Mercearia', percentage: 45.2 },
          { name: 'Bebidas', percentage: 23.8 },
          { name: 'Limpeza', percentage: 18.5 },
          { name: 'Higiene', percentage: 12.5 }
        ],
        hourlyActivity: [
          { hour: 8, activity: 45 },
          { hour: 9, activity: 78 },
          { hour: 10, activity: 92 },
          { hour: 11, activity: 85 },
          { hour: 12, activity: 110 },
          { hour: 13, activity: 98 },
          { hour: 14, activity: 125 },
          { hour: 15, activity: 134 },
          { hour: 16, activity: 145 },
          { hour: 17, activity: 167 },
          { hour: 18, activity: 189 },
          { hour: 19, activity: 156 },
          { hour: 20, activity: 123 },
          { hour: 21, activity: 98 }
        ]
      },
      lastUpdated: '2024-01-30T15:30:00Z'
    },
    {
      marketId: 'market-002',
      marketName: 'Mercado Central',
      location: 'São Paulo, SP',
      period: 'Últimos 30 dias',
      metrics: {
        totalUsers: 856,
        activeUsers: 623,
        newUsers: 89,
        userGrowth: 8.4,
        totalSearches: 5234,
        searchGrowth: 12.1,
        totalViews: 15432,
        viewsGrowth: 9.8,
        conversionRate: 4.2,
        avgSessionDuration: '3m 18s',
        topProducts: [
          { name: 'Leite Integral Nestlé 1L', views: 892, searches: 345 },
          { name: 'Pão de Açúcar Integral', views: 654, searches: 287 },
          { name: 'Refrigerante Coca-Cola 2L', views: 543, searches: 234 }
        ],
        topCategories: [
          { name: 'Laticínios', percentage: 38.7 },
          { name: 'Padaria', percentage: 28.4 },
          { name: 'Bebidas', percentage: 19.6 },
          { name: 'Mercearia', percentage: 13.3 }
        ],
        hourlyActivity: [
          { hour: 8, activity: 23 },
          { hour: 9, activity: 45 },
          { hour: 10, activity: 67 },
          { hour: 11, activity: 56 },
          { hour: 12, activity: 78 },
          { hour: 13, activity: 65 },
          { hour: 14, activity: 89 },
          { hour: 15, activity: 95 },
          { hour: 16, activity: 102 },
          { hour: 17, activity: 118 },
          { hour: 18, activity: 134 },
          { hour: 19, activity: 112 },
          { hour: 20, activity: 87 },
          { hour: 21, activity: 65 }
        ]
      },
      lastUpdated: '2024-01-30T14:45:00Z'
    }
  ]);

  const markets = [
    { id: 'all', name: 'Todos os Mercados' },
    { id: 'market-001', name: 'Supermercado Vila Nova' },
    { id: 'market-002', name: 'Mercado Central' },
    { id: 'market-003', name: 'Mercado Popular' }
  ];

  const periods = [
    { id: '7d', name: 'Últimos 7 dias' },
    { id: '30d', name: 'Últimos 30 dias' },
    { id: '90d', name: 'Últimos 90 dias' },
    { id: '1y', name: 'Último ano' }
  ];

  const getFilteredData = () => {
    if (selectedMarket === 'all') {
      return analyticsData;
    }
    return analyticsData.filter(data => data.marketId === selectedMarket);
  };

  const getAggregatedMetrics = (data: MarketAnalytics[]) => {
    return data.reduce((acc, market) => ({
      totalUsers: acc.totalUsers + market.metrics.totalUsers,
      activeUsers: acc.activeUsers + market.metrics.activeUsers,
      newUsers: acc.newUsers + market.metrics.newUsers,
      totalSearches: acc.totalSearches + market.metrics.totalSearches,
      totalViews: acc.totalViews + market.metrics.totalViews,
      avgConversionRate: data.length > 0 ? 
        data.reduce((sum, m) => sum + m.metrics.conversionRate, 0) / data.length : 0
    }), {
      totalUsers: 0,
      activeUsers: 0,
      newUsers: 0,
      totalSearches: 0,
      totalViews: 0,
      avgConversionRate: 0
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredData = getFilteredData();
  const aggregatedMetrics = getAggregatedMetrics(filteredData);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-2xl font-bold text-[#004A7C] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="truncate">Analytics Global</span>
          </h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base hidden sm:block">
            Visualize dados de analytics de todos os mercados do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {/* Refresh data */}}
            className="p-2 text-gray-500 hover:text-[#004A7C] hover:bg-gray-100 rounded-lg transition-all"
            title="Atualizar dados"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {/* Export data */}}
            className="bg-[#004A7C] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-[#0066A3] transition-all duration-300 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
            >
              {markets.map(market => (
                <option key={market.id} value={market.id}>{market.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
            >
              {periods.map(period => (
                <option key={period.id} value={period.id}>{period.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1 rounded-md text-sm transition-all ${
                viewMode === 'overview' ? 'bg-white text-[#004A7C] shadow-sm' : 'text-gray-600'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1 rounded-md text-sm transition-all ${
                viewMode === 'detailed' ? 'bg-white text-[#004A7C] shadow-sm' : 'text-gray-600'
              }`}
            >
              Detalhado
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Usuários</p>
              <p className="text-2xl font-bold text-[#004A7C]">{aggregatedMetrics.totalUsers.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">+12.5%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Buscas</p>
              <p className="text-2xl font-bold text-[#004A7C]">{aggregatedMetrics.totalSearches.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">+18.3%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Visualizações</p>
              <p className="text-2xl font-bold text-[#004A7C]">{aggregatedMetrics.totalViews.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">+15.7%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-[#004A7C]">{aggregatedMetrics.avgConversionRate.toFixed(1)}%</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">+2.1%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Market Details */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredData.map((marketData) => (
            <div key={marketData.marketId} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[#004A7C]">{marketData.marketName}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <MapPin className="w-3 h-3" />
                      {marketData.location}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(marketData.lastUpdated)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#004A7C]">{marketData.metrics.totalUsers}</div>
                    <div className="text-sm text-gray-600">Total Usuários</div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">+{marketData.metrics.userGrowth}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#004A7C]">{marketData.metrics.activeUsers}</div>
                    <div className="text-sm text-gray-600">Usuários Ativos</div>
                    <div className="text-xs text-gray-500 mt-1">{marketData.metrics.avgSessionDuration} avg</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Top Produtos</h4>
                  {marketData.metrics.topProducts.slice(0, 3).map((product, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 truncate flex-1">{product.name}</span>
                      <div className="flex items-center gap-3 text-gray-500">
                        <span>{product.views} views</span>
                        <span>{product.searches} buscas</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed View */}
      {viewMode === 'detailed' && selectedMarket !== 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Chart Placeholder */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-[#004A7C] mb-4">Atividade por Hora</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <LineChart className="w-12 h-12 mx-auto mb-2" />
                <p>Gráfico de atividade por hora</p>
                <p className="text-sm">Implementação em desenvolvimento</p>
              </div>
            </div>
          </div>

          {/* Categories Breakdown */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-[#004A7C] mb-4">Categorias Populares</h3>
            <div className="space-y-3">
              {filteredData[0]?.metrics.topCategories.map((category, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{category.name}</span>
                    <span className="text-gray-500">{category.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#004A7C] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Data State */}
      {filteredData.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado disponível</h3>
          <p className="text-gray-600">
            Não há dados de analytics para o mercado selecionado no período escolhido.
          </p>
        </div>
      )}
    </div>
  );
};

export default MarketAnalyticsAccess;