// TrendChart.tsx - COMPONENTE MOBILE-FIRST PARA GRÁFICOS DE TENDÊNCIA
import React from 'react';
import { TrendingUp, TrendingDown, BarChart3, PieChart } from 'lucide-react';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface TrendChartProps {
  title: string;
  subtitle?: string;
  data: DataPoint[];
  type?: 'line' | 'bar' | 'pie' | 'area';
  height?: number;
  showLegend?: boolean;
  color?: string;
  trend?: {
    direction: 'up' | 'down';
    percentage: string;
  };
  loading?: boolean;
}

const TrendChart: React.FC<TrendChartProps> = ({
  title,
  subtitle,
  data,
  type = 'line',
  height = 200,
  showLegend = true,
  color = '#004A7C',
  trend,
  loading = false
}) => {

  // Função para calcular a posição dos pontos no gráfico
  const calculatePoints = () => {
    if (!data.length) return '';
    
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;
    
    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((point.value - minValue) / range) * 80; // 80% da altura para dar margem
      return `${x},${y}`;
    }).join(' ');
    
    return points;
  };

  const renderSimpleLineChart = () => (
    <div className="relative" style={{ height: `${height}px` }}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
        
        {/* Área preenchida */}
        <path
          d={`M 0,100 L ${calculatePoints()} L 100,100 Z`}
          fill={`${color}20`}
          stroke="none"
        />
        
        {/* Linha de tendência */}
        <polyline
          points={calculatePoints()}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Pontos */}
        {data.map((point, index) => {
          const maxValue = Math.max(...data.map(d => d.value));
          const minValue = Math.min(...data.map(d => d.value));
          const range = maxValue - minValue || 1;
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((point.value - minValue) / range) * 80;
          
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={color}
              stroke="white"
              strokeWidth="1"
            />
          );
        })}
      </svg>
    </div>
  );

  const renderSimpleBarChart = () => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="flex items-end justify-between gap-2" style={{ height: `${height}px` }}>
        {data.map((point, index) => {
          const heightPercentage = (point.value / maxValue) * 100;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full rounded-t-md transition-all duration-500 ease-out"
                style={{ 
                  height: `${heightPercentage}%`,
                  backgroundColor: point.color || color,
                  minHeight: '4px'
                }}
              />
              <span className="text-xs text-gray-600 mt-2 text-center break-all">
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPieChart = () => {
    const total = data.reduce((sum, point) => sum + point.value, 0);
    let cumulativePercentage = 0;
    
    const colors = ['#004A7C', '#B9E937', '#0066A3', '#8BC34A', '#4CAF50'];
    
    return (
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-32 h-32 mx-auto">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {data.map((point, index) => {
              const percentage = (point.value / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -cumulativePercentage;
              const color = point.color || colors[index % colors.length];
              
              cumulativePercentage += percentage;
              
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={color}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
        </div>
        
        {showLegend && (
          <div className="flex-1 space-y-2">
            {data.map((point, index) => {
              const percentage = ((point.value / total) * 100).toFixed(1);
              const color = point.color || colors[index % colors.length];
              
              return (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-gray-700 flex-1">{point.label}</span>
                  <span className="text-sm font-medium text-gray-900">{percentage}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-[#004A7C] text-sm md:text-base">{title}</h3>
          {subtitle && (
            <p className="text-xs md:text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.direction === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{trend.percentage}</span>
          </div>
        )}
      </div>

      {/* Chart */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <BarChart3 className="w-12 h-12 mb-2 opacity-50" />
          <p className="text-sm">Nenhum dado disponível</p>
        </div>
      ) : (
        <>
          {type === 'line' && renderSimpleLineChart()}
          {type === 'area' && renderSimpleLineChart()}
          {type === 'bar' && renderSimpleBarChart()}
          {type === 'pie' && renderPieChart()}
        </>
      )}

      {/* Legend for line/bar charts */}
      {showLegend && (type === 'line' || type === 'bar') && data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {data.slice(0, 6).map((point, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: point.color || color }}
                />
                <span className="text-xs text-gray-700 truncate">{point.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendChart;