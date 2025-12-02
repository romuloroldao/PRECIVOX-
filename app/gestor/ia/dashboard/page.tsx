'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  MetricCard, 
  AlertBadge, 
  ScoreGauge, 
  TrendIndicator,
  DemandHeatmap,
  StockRuptureIndicator,
  ExcessStockIndicator,
  PriceElasticityCurve
} from '@/components/ai-dashboard';
import { TrendingUp, Package, AlertTriangle, DollarSign, RefreshCw } from 'lucide-react';
import { fetchDashboardData } from '@/lib/ai-api';

export default function AIInsightsDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Obter mercadoId do usuário logado
  const mercadoId = (session?.user as any)?.mercadoId || 'mercado-1764614505466-1'; // Fallback para teste

  useEffect(() => {
    if (session) {
      loadDashboardData();
    }
  }, [session]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchDashboardData(mercadoId);
      
      // Processar dados para o formato do dashboard
      const processedData = {
        metrics: {
          totalProducts: data.demand.predictions.length || 0,
          stockHealth: data.stockHealth?.score || 0,
          avgDemand: calculateAvgDemand(data.demand.predictions),
          priceOptimization: calculatePriceOptimization(data.pricing.recommendations),
        },
        trends: {
          sales: calculateSalesTrend(data.demand.predictions),
          stock: data.stockHealth?.score ? (data.stockHealth.score - 75) : 0,
          demand: calculateDemandTrend(data.demand.predictions),
        },
        alerts: data.stockHealth?.alertas || [],
        demandHeatmap: data.demand.heatmap || [],
        stockRupture: data.stockHealth?.produtosRisco || [],
        excessStock: data.stockHealth?.produtosExcesso || [],
        priceElasticity: data.pricing.elasticity || [],
        recommendations: data.pricing.recommendations || [],
      };

      setDashboardData(processedData);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Erro ao carregar dashboard:', err);
      setError(err.message || 'Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando insights de IA...</p>
          <p className="text-gray-400 text-sm mt-2">Analisando dados do mercado</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao Carregar Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-5 w-5" />
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Inteligência</h1>
            <p className="text-gray-600">Insights e análises preditivas para otimização do negócio</p>
            {lastUpdate && (
              <p className="text-sm text-gray-400 mt-1">
                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Alerts Section */}
        {dashboardData.alerts && dashboardData.alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Alertas Importantes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.alerts.slice(0, 6).map((alert: any, index: number) => (
                <AlertBadge
                  key={index}
                  type={alert.tipo}
                  message={alert.mensagem}
                  severity={alert.severidade}
                />
              ))}
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total de Produtos"
            value={dashboardData.metrics.totalProducts}
            icon={Package}
            color="blue"
            trend={{
              value: dashboardData.trends.sales,
              label: 'vs mês anterior',
              direction: dashboardData.trends.sales > 0 ? 'up' : 'down'
            }}
          />
          
          <MetricCard
            title="Saúde do Estoque"
            value={`${Math.round(dashboardData.metrics.stockHealth)}%`}
            icon={TrendingUp}
            color="green"
            trend={{
              value: dashboardData.trends.stock,
              label: 'vs semana anterior',
              direction: dashboardData.trends.stock > 0 ? 'up' : 'down'
            }}
          />
          
          <MetricCard
            title="Demanda Média"
            value={Math.round(dashboardData.metrics.avgDemand)}
            icon={TrendingUp}
            color="purple"
            trend={{
              value: dashboardData.trends.demand,
              label: 'vs semana anterior',
              direction: dashboardData.trends.demand > 0 ? 'up' : 'down'
            }}
          />
          
          <MetricCard
            title="Otimização de Preço"
            value={`${Math.round(dashboardData.metrics.priceOptimization)}%`}
            icon={DollarSign}
            color="orange"
            trend={{
              value: 5.3,
              label: 'potencial de melhoria',
              direction: 'up'
            }}
          />
        </div>

        {/* Score Gauge */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Score Geral de Saúde</h2>
            <ScoreGauge 
              score={Math.round(dashboardData.metrics.stockHealth)} 
              label="Saúde do Estoque"
            />
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Demand Heatmap */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mapa de Calor - Demanda</h2>
            <DemandHeatmap data={dashboardData.demandHeatmap} />
          </div>

          {/* Price Elasticity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Curva de Elasticidade de Preço</h2>
            <PriceElasticityCurve data={dashboardData.priceElasticity} />
          </div>
        </div>

        {/* Stock Indicators */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Rupture */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Risco de Ruptura</h2>
            <StockRuptureIndicator data={dashboardData.stockRupture} />
          </div>

          {/* Excess Stock */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Estoque Excedente</h2>
            <ExcessStockIndicator data={dashboardData.excessStock} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions para cálculos

function calculateAvgDemand(predictions: any[]): number {
  if (!predictions || predictions.length === 0) return 0;
  const total = predictions.reduce((acc, pred) => acc + (pred.demandaPrevista || 0), 0);
  return total / predictions.length;
}

function calculatePriceOptimization(recommendations: any[]): number {
  if (!recommendations || recommendations.length === 0) return 0;
  // Calcular % de produtos com preço otimizado
  const optimized = recommendations.filter(rec => 
    Math.abs(rec.precoSugerido - rec.precoAtual) < rec.precoAtual * 0.05
  ).length;
  return (optimized / recommendations.length) * 100;
}

function calculateSalesTrend(predictions: any[]): number {
  if (!predictions || predictions.length === 0) return 0;
  // Simular tendência baseada nas previsões
  const avgTendencia = predictions.reduce((acc, pred) => {
    const trendValue = pred.tendencia === 'alta' ? 1 : pred.tendencia === 'baixa' ? -1 : 0;
    return acc + trendValue;
  }, 0) / predictions.length;
  return avgTendencia * 10; // Escalar para %
}

function calculateDemandTrend(predictions: any[]): number {
  if (!predictions || predictions.length === 0) return 0;
  // Calcular tendência média de demanda
  const highDemand = predictions.filter(p => p.tendencia === 'alta').length;
  return ((highDemand / predictions.length) - 0.5) * 20; // Converter para %
}
