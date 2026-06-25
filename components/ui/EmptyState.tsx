'use client';

import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  title = 'Nenhum item encontrado',
  message = 'Não há dados para exibir no momento.',
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-xl border-2 border-dashed border-slate-200 bg-white p-8 text-center',
        className
      )}
    >
      {icon ?? (
        <PackageOpen className="mx-auto h-12 w-12 text-slate-300" aria-hidden />
      )}
      <h3 className="mt-4 text-base font-semibold text-text-primary">{title}</h3>
      <p className="mx-auto mt-1 max-w-xs text-sm text-text-secondary">{message}</p>
      {action && (
        <Button variant="primary" size="md" onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
