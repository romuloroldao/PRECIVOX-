// InsightCard.tsx - COMPONENTE MOBILE-FIRST PARA INSIGHTS
import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';

interface InsightCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  type?: 'success' | 'warning' | 'info' | 'danger';
  value?: string | number;
  trend?: {
    direction: 'up' | 'down';
    percentage: string;
  };
  actionLabel?: string;
  onAction?: () => void;
  priority?: 'high' | 'medium' | 'low';
  timestamp?: string;
}

const InsightCard: React.FC<InsightCardProps> = ({
  title,
  description,
  icon: CustomIcon,
  type = 'info',
  value,
  trend,
  actionLabel,
  onAction,
  priority = 'medium',
  timestamp
}) => {

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-600',
          iconBg: 'bg-green-100',
          title: 'text-green-900',
          description: 'text-green-700',
          button: 'bg-green-600 hover:bg-green-700 text-white',
          defaultIcon: TrendingUp
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          title: 'text-yellow-900',
          description: 'text-yellow-700',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          defaultIcon: AlertTriangle
        };
      case 'danger':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          iconBg: 'bg-red-100',
          title: 'text-red-900',
          description: 'text-red-700',
          button: 'bg-red-600 hover:bg-red-700 text-white',
          defaultIcon: TrendingDown
        };
      default: // info
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          iconBg: 'bg-blue-100',
          title: 'text-blue-900',
          description: 'text-blue-700',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          defaultIcon: Info
        };
    }
  };

  const getPriorityIndicator = () => {
    switch (priority) {
      case 'high':
        return <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>;
      case 'medium':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>;
      case 'low':
        return <div className="w-3 h-3 bg-green-500 rounded-full"></div>;
      default:
        return null;
    }
  };

  const config = getTypeConfig();
  const Icon = CustomIcon || config.defaultIcon;

  return (
    <div className={`
      ${config.bg} ${config.border} border rounded-xl p-4 shadow-sm
      hover:shadow-md transition-all duration-300
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${config.iconBg} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${config.icon}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold text-sm ${config.title}`}>{title}</h3>
              {getPriorityIndicator()}
            </div>
            {timestamp && (
              <p className="text-xs text-gray-500 mt-1">{timestamp}</p>
            )}
          </div>
        </div>
        
        {/* Value and Trend */}
        {(value || trend) && (
          <div className="text-right">
            {value && (
              <div className={`text-lg font-bold ${config.title}`}>
                {value}
              </div>
            )}
            {trend && (
              <div className={`text-xs font-medium flex items-center gap-1 ${
                trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.direction === 'up' ? '↗️' : '↘️'}
                {trend.percentage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      <p className={`${config.description} text-sm leading-relaxed mb-4`}>
        {description}
      </p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <div className="flex justify-end">
          <button
            onClick={onAction}
            className={`
              ${config.button}
              px-4 py-2 text-sm font-medium rounded-lg
              transition-all duration-300
              shadow-sm hover:shadow-md
            `}
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default InsightCard;