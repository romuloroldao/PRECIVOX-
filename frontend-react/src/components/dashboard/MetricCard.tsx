// MetricCard.tsx - COMPONENTE MOBILE-FIRST PARA MÉTRICAS
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  color = 'blue',
  size = 'medium',
  onClick,
  loading = false
}) => {
  
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      icon: 'text-blue-600',
      iconBg: 'bg-blue-100'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      icon: 'text-green-600',
      iconBg: 'bg-green-100'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      icon: 'text-purple-600',
      iconBg: 'bg-purple-100'
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      icon: 'text-orange-600',
      iconBg: 'bg-orange-100'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      icon: 'text-red-600',
      iconBg: 'bg-red-100'
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      icon: 'text-yellow-600',
      iconBg: 'bg-yellow-100'
    }
  };

  const sizeClasses = {
    small: {
      padding: 'p-3',
      iconSize: 'w-4 h-4',
      iconContainer: 'w-8 h-8',
      titleSize: 'text-xs',
      valueSize: 'text-lg',
      changeSize: 'text-xs'
    },
    medium: {
      padding: 'p-4',
      iconSize: 'w-5 h-5',
      iconContainer: 'w-10 h-10',
      titleSize: 'text-sm',
      valueSize: 'text-xl md:text-2xl',
      changeSize: 'text-sm'
    },
    large: {
      padding: 'p-6',
      iconSize: 'w-6 h-6',
      iconContainer: 'w-12 h-12',
      titleSize: 'text-base',
      valueSize: 'text-2xl md:text-3xl',
      changeSize: 'text-base'
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      default:
        return '→';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const colors = colorClasses[color];
  const sizes = sizeClasses[size];

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${sizes.padding} animate-pulse`}>
        <div className="flex items-center justify-between mb-3">
          <div className={`${sizes.iconContainer} ${colors.iconBg} rounded-lg`}></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300
        ${sizes.padding}
        ${onClick ? 'cursor-pointer hover:border-[#004A7C]/20' : ''}
      `}
      onClick={onClick}
    >
      {/* Header com ícone */}
      <div className="flex items-center justify-between mb-3">
        <div className={`${sizes.iconContainer} ${colors.iconBg} rounded-lg flex items-center justify-center`}>
          <Icon className={`${sizes.iconSize} ${colors.icon}`} />
        </div>
        {change && (
          <span className={`${sizes.changeSize} font-medium ${getTrendColor(change.trend)}`}>
            {getTrendIcon(change.trend)} {change.value}
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div>
        <p className={`${sizes.titleSize} text-gray-600 mb-1`}>{title}</p>
        <p className={`${sizes.valueSize} font-bold ${colors.text}`}>
          {value}
        </p>
      </div>
    </div>
  );
};

export default MetricCard;