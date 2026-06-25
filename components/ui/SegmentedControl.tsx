'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
  'aria-label'?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex rounded-xl bg-slate-100 p-1',
        size === 'sm' ? 'text-xs' : 'text-sm',
        className
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-medium transition-all',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
              selected
                ? 'bg-white text-text-primary shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
