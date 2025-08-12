// components/dashboard/charts/TrendChart.tsx
import React, { useState, useMemo } from 'react';
import { TrendingUp, Calendar, BarChart3, Activity } from 'lucide-react';

interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface TrendChartProps {
  title?: string;
  data?: TrendDataPoint[];
  metric?: string;
  period?: '7d' | '30d' | '90d';
  color?: 'blue' | 'green' | 'purple' | 'orange';
  showGrowth?: boolean;
  className?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  title = '📈 Tendência de Performance',
  data,
  metric = 'Visualizações',
  period = '30d',
  color = 'blue',
  showGrowth = true,
  className = ''
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Dados mock se não fornecidos
  const generateMockData = (): TrendDataPoint[] => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const data: TrendDataPoint[] = [];
    let baseValue = 1000;
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      
      // Simular tendência com alguma variação
      baseValue += (Math.random() - 0.4) * 100;
      baseValue = Math.max(500, baseValue); // Valor mínimo
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(baseValue),
        label: date.toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit' 
        })
      });
    }
    
    return data;
  };

  const chartData = data || generateMockData();

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const values = chartData.map(d => d.value);
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    const growth = ((lastValue - firstValue) / firstValue) * 100;
    const trend = growth > 5 ? 'up' : growth < -5 ? 'down' : 'stable';

    return {
      firstValue,
      lastValue,
      maxValue,
      minValue,
      avgValue,
      growth,
      trend,
      total: values.reduce((sum, val) => sum + val, 0)
    };
  }, [chartData]);

  const colorClasses = {
    blue: { 
      primary: 'stroke-blue-500 fill-blue-500', 
      bg: 'fill-blue-500/10',
      text: 'text-blue-600',
      dot: 'bg-blue-500'
    },
    green: { 
      primary: 'stroke-green-500 fill-green-500', 
      bg: 'fill-green-500/10',
      text: 'text-green-600',
      dot: 'bg-green-500'
    },
    purple: { 
      primary: 'stroke-purple-500 fill-purple-500', 
      bg: 'fill-purple-500/10',
      text: 'text-purple-600',
      dot: 'bg-purple-500'
    },
    orange: { 
      primary: 'stroke-orange-500 fill-orange-500', 
      bg: 'fill-orange-500/10',
      text: 'text-orange-600',
      dot: 'bg-orange-500'
    }
  };

  const colors = colorClasses[color];

  // Calcular pontos do SVG
  const svgPoints = useMemo(() => {
    if (!stats || chartData.length === 0) return { line: '', area: '' };

    const width = 400;
    const height = 200;
    const padding = 20;
    
    const xStep = (width - 2 * padding) / (chartData.length - 1);
    const yRange = stats.maxValue - stats.minValue;
    const yScale = yRange > 0 ? (height - 2 * padding) / yRange : 0;

    const points = chartData.map((point, index) => {
      const x = padding + index * xStep;
      const y = height - padding - ((point.value - stats.minValue) * yScale);
      return { x, y, value: point.value, label: point.label };
    });

    const line = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    const area = `M ${padding} ${height - padding} ` + 
                 points.map(point => `L ${point.x} ${point.y}`).join(' ') +
                 ` L ${width - padding} ${height - padding} Z`;

    return { line, area, points, width, height };
  }, [chartData, stats]);

  if (!stats) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <BarChart3 className="w-8 h-8 mx-auto mb-2" />
          <p>Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          {title}
        </h3>
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {period === '7d' ? 'Últimos 7 dias' : 
             period === '30d' ? 'Últimos 30 dias' : 
             'Últimos 90 dias'}
          </span>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Atual</p>
          <p className={`text-lg font-bold ${colors.text}`}>
            {stats.lastValue.toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Média</p>
          <p className="text-lg font-bold text-gray-900">
            {Math.round(stats.avgValue).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Máximo</p>
          <p className="text-lg font-bold text-green-600">
            {stats.maxValue.toLocaleString()}
          </p>
        </div>
        {showGrowth && (
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Crescimento</p>
            <div className="flex items-center justify-center gap-1">
              {stats.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
              {stats.trend === 'down' && <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />}
              {stats.trend === 'stable' && <Activity className="w-4 h-4 text-gray-500" />}
              <p className={`font-bold ${
                stats.growth > 0 ? 'text-green-600' : 
                stats.growth < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {stats.growth > 0 ? '+' : ''}{stats.growth.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chart SVG */}
      <div className="relative">
        <svg
          width="100%"
          height="200"
          viewBox={`0 0 ${svgPoints.width} ${svgPoints.height}`}
          className="overflow-visible"
        >
          {/* Área sob a curva */}
          <path
            d={svgPoints.area}
            className={colors.bg}
            strokeWidth="0"
          />
          
          {/* Linha principal */}
          <path
            d={svgPoints.line}
            className={colors.primary}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pontos de dados */}
          {svgPoints.points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={hoveredPoint === index ? "6" : "4"}
              className={`${colors.dot} cursor-pointer transition-all`}
              onMouseEnter={() => setHoveredPoint(index)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredPoint !== null && (
          <div 
            className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg text-sm pointer-events-none z-10"
            style={{
              left: `${(svgPoints.points[hoveredPoint].x / svgPoints.width) * 100}%`,
              top: `${(svgPoints.points[hoveredPoint].y / svgPoints.height) * 100 - 10}%`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="text-center">
              <p className="font-medium">{chartData[hoveredPoint].label}</p>
              <p className={`text-lg font-bold`}>
                {svgPoints.points[hoveredPoint].value.toLocaleString()}
              </p>
              <p className="text-xs opacity-75">{metric}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          📊 Total no período: {stats.total.toLocaleString()} {metric.toLowerCase()}
        </p>
      </div>
    </div>
  );
};