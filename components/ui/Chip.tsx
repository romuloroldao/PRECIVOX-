'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  count?: number;
  variant?: 'default' | 'primary' | 'success';
}

export function Chip({
  selected = false,
  count,
  variant = 'default',
  className,
  children,
  ...props
}: ChipProps) {
  const variants = {
    default: selected
      ? 'bg-primary-600 text-white border-primary-600'
      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
    primary: selected
      ? 'bg-primary-600 text-white border-primary-600'
      : 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100',
    success: selected
      ? 'bg-emerald-600 text-white border-emerald-600'
      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
  };

  return (
    <button
      type="button"
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
        'min-h-[44px] md:min-h-0',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
      {count != null && count > 0 && (
        <span
          className={cn(
            'rounded-full px-1.5 text-xs font-bold',
            selected ? 'bg-white/25' : 'bg-slate-100 text-slate-600'
          )}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
