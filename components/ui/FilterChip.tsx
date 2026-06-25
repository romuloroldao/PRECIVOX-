'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

/** Chip de filtro ativo com opção de remover */
export function FilterChip({
  label,
  active = false,
  onClick,
  onRemove,
  className,
}: FilterChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium',
        active
          ? 'bg-primary-100 text-primary-800 border border-primary-200'
          : 'bg-slate-100 text-slate-600 border border-slate-200',
        className
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="focus:outline-none focus:underline"
      >
        {label}
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-0.5 hover:bg-primary-200/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label={`Remover filtro ${label}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
}
