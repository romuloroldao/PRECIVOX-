'use client';

import React, { useState, useEffect } from 'react';
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
import { TrendingUp, Package, AlertTriangle, DollarSign } from 'lucide-react';

export default function AIInsightsDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API calls to /api/ai-engines/*
      // For now, using mock data
      const mockData = {
        metrics: {
          totalProducts: 1250,
          stockHealth: 78,
          avgDemand: 450,
          priceOptimization: 85,
        },
        trends: {
          sales: 12.5,
          stock: -3.2,
          demand: 8.7,
        },
        demandHeatmap: generateMockHeatmapData(),
        stockRupture: generateMockRuptureData(),
        excessStock: generateMockExcessData(),
        priceElasticity: generateMockElasticityData(),
      };

      setDashboardData(mockData);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Inteligência</h1>
          <p className="text-gray-600">Insights e análises preditivas para otimização do negócio</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total de Produtos"
            value={dashboardData?.metrics.totalProducts || 0}
            icon={Package}
            color="blue"
            trend={{
              value: dashboardData?.trends.sales || 0,
              label: 'vs mês anterior',
              direction: dashboardData?.trends.sales > 0 ? 'up' : 'down'
            }}
          />
          
          <MetricCard
            title="Saúde do Estoque"
            value={`${dashboardData?.metrics.stockHealth || 0}%`}
            icon={TrendingUp}
            color="green"
            trend={{
              value: dashboardData?.trends.stock || 0,
              label: 'vs semana anterior',
              direction: dashboardData?.trends.stock > 0 ? 'up' : 'down'
            }}
          />
          
          <MetricCard
            title="Demanda Média"
            value={dashboardData?.metrics.avgDemand || 0}
            icon={AlertTriangle}
            color="purple"
            trend={{
              value: dashboardData?.trends.demand || 0,
              label: 'itens/dia',
              direction: dashboardData?.trends.demand > 0 ? 'up' : 'down'
            }}
          />
          
          <MetricCard
            title="Otimização de Preço"
            value={`${dashboardData?.metrics.priceOptimization || 0}%`}
            icon={DollarSign}
            color="orange"
          />
        </div>

        {/* Score Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <ScoreGauge 
              score={dashboardData?.metrics.stockHealth || 0} 
              label="Saúde do Estoque"
            />
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <ScoreGauge 
              score={dashboardData?.metrics.priceOptimization || 0} 
              label="Otimização de Preço"
            />
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <ScoreGauge 
              score={75} 
              label="Eficiência Geral"
            />
          </div>
        </div>

        {/* Visualizations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <DemandHeatmap data={dashboardData?.demandHeatmap || []} />
          <PriceElasticityCurve 
            data={dashboardData?.priceElasticity || []}
            currentPrice={10.50}
            optimalPrice={9.80}
          />
        </div>

        {/* Stock Indicators */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StockRuptureIndicator data={dashboardData?.stockRupture || []} />
          <ExcessStockIndicator data={dashboardData?.excessStock || []} />
        </div>
      </div>
    </div>
  );
}

// Mock data generators
function generateMockHeatmapData() {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const data = [];
  for (let day of days) {
    for (let hour = 0; hour < 24; hour++) {
      data.push({
        day,
        hour,
        value: Math.floor(Math.random() * 100)
      });
    }
  }
  return data;
}

function generateMockRuptureData() {
  return [
    { name: 'Arroz 5kg', currentStock: 15, minStock: 50, riskLevel: 'critical' as const },
    { name: 'Feijão 1kg', currentStock: 25, minStock: 40, riskLevel: 'warning' as const },
    { name: 'Açúcar 1kg', currentStock: 30, minStock: 45, riskLevel: 'warning' as const },
    { name: 'Café 500g', currentStock: 12, minStock: 35, riskLevel: 'critical' as const },
    { name: 'Óleo 900ml', currentStock: 20, minStock: 30, riskLevel: 'warning' as const },
  ];
}

function generateMockExcessData() {
  return [
    { name: 'Macarrão', currentStock: 500, avgSales: 5, daysOfStock: 100 },
    { name: 'Molho Tomate', currentStock: 300, avgSales: 6, daysOfStock: 50 },
    { name: 'Biscoito', currentStock: 250, avgSales: 7, daysOfStock: 35 },
    { name: 'Refrigerante', currentStock: 200, avgSales: 10, daysOfStock: 20 },
    { name: 'Sabão em Pó', currentStock: 180, avgSales: 3, daysOfStock: 60 },
  ];
}

function generateMockElasticityData() {
  const data = [];
  for (let price = 8; price <= 12; price += 0.5) {
    data.push({
      price,
      demand: Math.floor(200 - (price - 8) * 15 + Math.random() * 10)
    });
  }
  return data;
}
