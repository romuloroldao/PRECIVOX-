import React from 'react';
import { LucideIcon } from 'lucide-react';
import { getCategoryIcon, getCategoryColor } from '../../../utils/categoryIcons';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon?: string | LucideIcon;
  subtitle?: string;
  isLive?: boolean;
  className?: string;
  onClick?: () => void;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan' | 'pink' | 'yellow';
  loading?: boolean;
  change?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  icon,
  subtitle,
  isLive = false,
  className = '',
  onClick,
  color = 'blue',
  loading = false,
  change
}) => {
  // ✅ CONVERSÃO SEGURA DE VALORES
  const safeValue = React.useMemo(() => {
    if (loading) return '...';
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return String(value);
    return String(value);
  }, [value, loading]);

  const safeTrend = React.useMemo(() => {
    if (trend === null || trend === undefined) return undefined;
    if (typeof trend === 'object') return 0;
    return Number(trend) || 0;
  }, [trend]);

  const safeTitle = React.useMemo(() => {
    if (!title) return 'Métrica';
    if (typeof title === 'object') return 'Métrica';
    return String(title);
  }, [title]);

  const safeSubtitle = React.useMemo(() => {
    if (change) return change;
    if (!subtitle) return undefined;
    if (typeof subtitle === 'object') return undefined;
    return String(subtitle);
  }, [subtitle, change]);

  // ✅ SISTEMA DE CORES PREMIUM
  const getColorScheme = (colorName: string) => {
    const schemes = {
      blue: {
        gradient: 'from-blue-500 to-blue-600',
        bg: 'bg-blue-50',
        text: 'text-blue-900',
        accent: 'text-blue-600',
        border: 'border-blue-200',
        shadow: 'shadow-blue-100',
        icon: 'bg-blue-100 text-blue-600'
      },
      green: {
        gradient: 'from-green-500 to-emerald-600',
        bg: 'bg-green-50',
        text: 'text-green-900',
        accent: 'text-green-600',
        border: 'border-green-200',
        shadow: 'shadow-green-100',
        icon: 'bg-green-100 text-green-600'
      },
      purple: {
        gradient: 'from-purple-500 to-violet-600',
        bg: 'bg-purple-50',
        text: 'text-purple-900',
        accent: 'text-purple-600',
        border: 'border-purple-200',
        shadow: 'shadow-purple-100',
        icon: 'bg-purple-100 text-purple-600'
      },
      orange: {
        gradient: 'from-orange-500 to-amber-600',
        bg: 'bg-orange-50',
        text: 'text-orange-900',
        accent: 'text-orange-600',
        border: 'border-orange-200',
        shadow: 'shadow-orange-100',
        icon: 'bg-orange-100 text-orange-600'
      },
      red: {
        gradient: 'from-red-500 to-rose-600',
        bg: 'bg-red-50',
        text: 'text-red-900',
        accent: 'text-red-600',
        border: 'border-red-200',
        shadow: 'shadow-red-100',
        icon: 'bg-red-100 text-red-600'
      },
      cyan: {
        gradient: 'from-cyan-500 to-teal-600',
        bg: 'bg-cyan-50',
        text: 'text-cyan-900',
        accent: 'text-cyan-600',
        border: 'border-cyan-200',
        shadow: 'shadow-cyan-100',
        icon: 'bg-cyan-100 text-cyan-600'
      },
      pink: {
        gradient: 'from-pink-500 to-rose-600',
        bg: 'bg-pink-50',
        text: 'text-pink-900',
        accent: 'text-pink-600',
        border: 'border-pink-200',
        shadow: 'shadow-pink-100',
        icon: 'bg-pink-100 text-pink-600'
      },
      yellow: {
        gradient: 'from-yellow-500 to-orange-600',
        bg: 'bg-yellow-50',
        text: 'text-yellow-900',
        accent: 'text-yellow-600',
        border: 'border-yellow-200',
        shadow: 'shadow-yellow-100',
        icon: 'bg-yellow-100 text-yellow-600'
      }
    };
    return schemes[colorName as keyof typeof schemes] || schemes.blue;
  };

  const colorScheme = getColorScheme(color);

  // ✅ LÓGICA DE TENDÊNCIA
  const getTrendColor = (trendValue: number) => {
    if (trendValue > 0) return 'text-emerald-600 bg-emerald-50';
    if (trendValue < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getTrendIcon = (trendValue: number) => {
    if (trendValue > 0) return '↗';
    if (trendValue < 0) return '↘';
    return '→';
  };

  // ✅ RENDERIZAR ÍCONE
  const renderIcon = () => {
    if (typeof icon === 'string') {
      return (
        <span className="text-2xl leading-none">
          {icon || getCategoryIcon(title)}
        </span>
      );
    }
    
    if (icon && typeof icon !== 'string') {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className="w-6 h-6" />;
    }
    
    return (
      <span className="text-2xl leading-none">
        {getCategoryIcon(title)}
      </span>
    );
  };

  return (
    <div 
      className={`
        relative overflow-hidden rounded-2xl bg-white border ${colorScheme.border}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        transition-all duration-300 ease-out
        hover:shadow-xl hover:shadow-gray-200 hover:-translate-y-1
        ${colorScheme.shadow}
        ${isLive ? 'ring-2 ring-green-200 ring-opacity-50' : ''}
        mobile-card mobile-no-overflow
        h-[220px] flex flex-col
        ${className}
      `}
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg, #ffffff 0%, ${colorScheme.bg.replace('bg-', '#')}10 100%)`
      }}
    >
      {/* ✅ INDICADOR AO VIVO */}
      {isLive && (
        <>
          <div className="absolute top-3 right-3 flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-green-600">AO VIVO</span>
          </div>
          
          {/* Efeito de borda animada */}
          <div className="absolute inset-0 rounded-2xl">
            <div className="absolute inset-0 rounded-2xl border-2 border-green-200 animate-pulse"></div>
          </div>
        </>
      )}
      
      {/* ✅ GRADIENTE SUTIL DE FUNDO */}
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorScheme.gradient} opacity-5 rounded-full -translate-y-8 translate-x-8`}></div>
      
      <div className="relative p-5 flex flex-col h-full">
        {/* ✅ HEADER COM ÍCONE E TENDÊNCIA */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${colorScheme.icon} transition-all duration-300 flex-shrink-0`}>
            {renderIcon()}
          </div>
          
          {safeTrend !== undefined && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg font-medium text-sm ${getTrendColor(safeTrend)} flex-shrink-0`}>
              <span className="text-xs">{getTrendIcon(safeTrend)}</span>
              <span>{Math.abs(safeTrend)}%</span>
            </div>
          )}
        </div>

        {/* ✅ CONTEÚDO PRINCIPAL - FLEX-GROW PARA PREENCHER ESPAÇO */}
        <div className="space-y-2 flex-grow flex flex-col justify-center">
          {/* Valor principal */}
          <div className="space-y-1">
            {loading ? (
              <div className="h-8 bg-gray-200 rounded-lg animate-pulse"></div>
            ) : (
              <h3 className={`text-2xl lg:text-3xl font-bold tracking-tight ${colorScheme.text} text-center`}>
                {safeValue}
              </h3>
            )}
          </div>
          
          {/* Título */}
          <p className="text-sm font-semibold text-gray-700 leading-tight text-center">
            {safeTitle}
          </p>
          
          {/* Subtítulo/Mudança */}
          {safeSubtitle && (
            <p className={`text-xs font-medium ${colorScheme.accent} flex items-center justify-center space-x-1`}>
              {safeTrend !== undefined && (
                <span className="text-xs opacity-75">
                  {getTrendIcon(safeTrend)}
                </span>
              )}
              <span>{safeSubtitle}</span>
            </p>
          )}
        </div>

        {/* ✅ LOADING STATE */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 rounded-2xl flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ${colorScheme.accent}`}></div>
              <span className={`text-sm font-medium ${colorScheme.accent}`}>Carregando...</span>
            </div>
          </div>
        )}

        {/* ✅ EFEITO HOVER */}
        {onClick && (
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black opacity-0 hover:opacity-5 transition-opacity duration-300 rounded-2xl"></div>
        )}
      </div>

    </div>
  );
};

export default MetricCard;