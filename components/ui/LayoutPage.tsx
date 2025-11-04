'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface LayoutPageProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  headerActions?: React.ReactNode;
  className?: string;
}

export function LayoutPage({
  children,
  title,
  description,
  headerActions,
  className,
}: LayoutPageProps) {
  return (
    <main className="min-h-screen bg-bg px-4 md:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        {(title || description || headerActions) && (
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                {title && (
                  <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-sm md:text-base text-text-secondary">
                    {description}
                  </p>
                )}
              </div>
              {headerActions && (
                <div className="flex items-center gap-2 flex-wrap">
                  {headerActions}
                </div>
              )}
            </div>
          </div>
        )}
        <div className={cn('', className)}>{children}</div>
      </div>
    </main>
  );
}
