import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendIndicatorProps {
  value: number;
  type?: 'standard' | 'inverse'; // standard: up is good (green), inverse: up is bad (red)
  showIcon?: boolean;
  showValue?: boolean;
  className?: string;
}

export function TrendIndicator({
  value,
  type = 'standard',
  showIcon = true,
  showValue = true,
  className,
}: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  let colorClass = 'text-gray-500';
  let Icon = Minus;

  if (isPositive) {
    colorClass = type === 'standard' ? 'text-green-600' : 'text-red-600';
    Icon = TrendingUp;
  } else if (isNegative) {
    colorClass = type === 'standard' ? 'text-red-600' : 'text-green-600';
    Icon = TrendingDown;
  }

  return (
    <div className={cn('flex items-center gap-1 font-medium', colorClass, className)}>
      {showIcon && <Icon size={16} />}
      {showValue && (
        <span>
          {isPositive ? '+' : ''}
          {value}%
        </span>
      )}
    </div>
  );
}
