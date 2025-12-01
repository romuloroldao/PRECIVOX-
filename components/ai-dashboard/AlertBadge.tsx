import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export type AlertType = 'critical' | 'warning' | 'success' | 'info';

interface AlertBadgeProps {
  type: AlertType;
  message?: string;
  className?: string;
  showIcon?: boolean;
}

export function AlertBadge({
  type,
  message,
  className,
  showIcon = true,
}: AlertBadgeProps) {
  const styles = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    success: 'bg-green-100 text-green-700 border-green-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const icons = {
    critical: AlertCircle,
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info,
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        styles[type],
        className
      )}
    >
      {showIcon && <Icon size={14} />}
      {message && <span>{message}</span>}
    </div>
  );
}
