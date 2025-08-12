// components/dashboard/charts/PerformanceChart.tsx
import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';

interface PerformanceData {
  category: string;
  performance: number;
  trend: 'up' | 'down' | 'stable';
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  details?: {
    views: number;
    conversions: number;
    revenue: number;
  };
}

interface PerformanceChartProps {
  title?: string;
  data?: PerformanceData[];
  showDetails?: boolean;
  className?: string;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  title = '📈 Performance por Categoria',
  data,
  showDetails = true,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Dados mock se não fornecidos
  const defaultData: PerformanceData[] = [
    { 
      category: 'Bebidas', 
      performance: 85, 
      trend: 'up', 
      color: 'blue',
      details: { views: 12500, conversions: 890, revenue: 45200 }
    },
    { 
      category: 'Limpeza', 
      performance: 78, 
      trend: 'up', 
      color: 'green',
      details: { views: 9800, conversions: 720, revenue: 38900 }
    },
    { 
      category: 'Higiene', 
      performance: 72, 
      trend: 'stable', 
      color: 'yellow',
      details: { views: 8600, conversions: 620, revenue: 31500 }
    },
    { 
      category: 'Carnes', 
      performance: 65, 
      trend: 'down', 
      color: 'red',
      details: { views: 7200, conversions: 480, revenue: 28700 }
    },
    { 
      category: 'Grãos', 
      performance: 88, 
      trend: 'up', 
      color: 'purple',
      details: { views: 11200, conversions: 950, revenue: 42800 }
    }
  ];

  const chartData = data || defaultData;

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'stable':
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPerformanceLabel = (performance: number) => {
    if (performance >= 80) return { label: 'Excelente', color: 'text-green-600 bg-green-100' };
    if (performance >= 70) return { label: 'Bom', color: 'text-yellow-600 bg-yellow-100' };
    if (performance >= 60) return { label: 'Regular', color: 'text-orange-600 bg-orange-100' };
    return { label: 'Atenção', color: 'text-red-600 bg-red-100' };
  };

  // Estatísticas gerais
  const stats = useMemo(() => {
    const total = chartData.length;
    const average = chartData.reduce((sum, item) => sum + item.performance, 0) / total;
    const best = Math.max(...chartData.map(item => item.performance));
    const worst = Math.min(...chartData.map(item => item.performance));
    const trending = chartData.filter(item => item.trend === 'up').length;

    return { total, average, best, worst, trending };
  }, [chartData]);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          {title}
        </h3>
        
        {/* Stats Resumo */}
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <p className="text-gray-500">Média</p>
            <p className="font-bold text-blue-600">{stats.average.toFixed(0)}%</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Em Alta</p>
            <p className="font-bold text-green-600">{stats.trending}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        {chartData.map((item, index) => {
          const perfLabel = getPerformanceLabel(item.performance);
          const isSelected = selectedCategory === item.category;
          
          return (
            <div key={index} className="space-y-2">
              {/* Barra Principal */}
              <div 
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedCategory(isSelected ? null : item.category)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-gray-900">{item.category}</h4>
                    {getTrendIcon(item.trend)}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${perfLabel.color}`}>
                      {perfLabel.label}
                    </span>
                    <span className="text-lg font-bold text-gray-900">{item.performance}%</span>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-1000 ${colorClasses[item.color]}`}
                      style={{ width: `${item.performance}%` }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white mix-blend-difference">
                      {item.performance}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Detalhes Expandidos */}
              {isSelected && showDetails && item.details && (
                <div className="ml-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Target className="w-4 h-4 text-blue-600" />
                        <p className="text-xs text-gray-500">Visualizações</p>
                      </div>
                      <p className="text-lg font-bold text-blue-600">
                        {item.details.views.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <p className="text-xs text-gray-500">Conversões</p>
                      </div>
                      <p className="text-lg font-bold text-green-600">
                        {item.details.conversions.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <BarChart3 className="w-4 h-4 text-purple-600" />
                        <p className="text-xs text-gray-500">Receita</p>
                      </div>
                      <p className="text-lg font-bold text-purple-600">
                        R$ {(item.details.revenue / 1000).toFixed(1)}k
                      </p>
                    </div>
                  </div>
                  
                  {/* Taxa de Conversão */}
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Taxa de Conversão:</span>
                      <span className="font-semibold text-gray-900">
                        {((item.details.conversions / item.details.views) * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer com Insights */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 mb-1">Melhor Performance</p>
            <p className="font-bold text-green-600">{stats.best}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Performance Média</p>
            <p className="font-bold text-blue-600">{stats.average.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Menor Performance</p>
            <p className="font-bold text-red-600">{stats.worst}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Categorias Ativas</p>
            <p className="font-bold text-purple-600">{stats.total}</p>
          </div>
        </div>
      </div>

      {/* Dica de Interação */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          💡 Clique nas categorias para ver detalhes completos
        </p>
      </div>
    </div>
  );
};