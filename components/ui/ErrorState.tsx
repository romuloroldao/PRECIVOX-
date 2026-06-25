'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'Algo deu errado',
  message = 'Não foi possível carregar. Tente novamente.',
  onRetry,
  retryLabel = 'Tentar de novo',
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-error-200 bg-error-50 p-6 text-center',
        className
      )}
      role="alert"
    >
      <AlertCircle className="mx-auto h-10 w-10 text-error-500" aria-hidden />
      <p className="mt-3 text-base font-semibold text-error-800">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-error-600">{message}</p>
      {onRetry && (
        <Button variant="primary" size="md" onClick={onRetry} className="mt-4">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
