'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
  disabled?: boolean;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  className,
  disabled = false,
}: QuantityStepperProps) {
  const btnSize = size === 'sm' ? 'h-9 w-9 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:h-8 sm:w-8' : 'h-11 w-11 min-h-[44px] min-w-[44px]';
  const textSize = size === 'sm' ? 'text-sm' : 'text-base';

  const decrement = () => {
    if (value > min) onChange(value - 1);
    else if (value === min && min === 0) onChange(0);
  };

  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div
      className={cn('inline-flex items-center gap-1', className)}
      role="group"
      aria-label="Quantidade"
    >
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || value <= min}
        className={cn(
          btnSize,
          'flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700',
          'transition-colors hover:bg-slate-50 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-40'
        )}
        aria-label="Diminuir quantidade"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span
        className={cn(
          'min-w-[2rem] text-center font-semibold tabular-nums text-text-primary',
          textSize
        )}
        aria-live="polite"
        aria-atomic
      >
        {value}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={disabled || value >= max}
        className={cn(
          btnSize,
          'flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700',
          'transition-colors hover:bg-slate-50 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-40'
        )}
        aria-label="Aumentar quantidade"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
