'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Visível apenas no mobile */
  mobileDescription?: string;
  actions?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function PageHeader({
  title,
  description,
  mobileDescription,
  actions,
  className,
  compact = false,
}: PageHeaderProps) {
  return (
    <header className={cn(compact ? 'mb-4' : 'mb-6', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1
            className={cn(
              'font-bold text-text-primary',
              compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl md:text-3xl'
            )}
          >
            {title}
          </h1>
          {(mobileDescription || description) && (
            <p className="mt-1 text-sm text-text-secondary md:hidden">
              {mobileDescription ?? description}
            </p>
          )}
          {description && (
            <p className="mt-1 hidden text-sm text-text-secondary md:block">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
