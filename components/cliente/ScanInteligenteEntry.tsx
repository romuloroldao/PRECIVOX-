'use client';

import Link from 'next/link';
import { ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  mercadoId?: string | null;
  className?: string;
  variant?: 'button' | 'link';
}

export function ScanInteligenteEntry({ mercadoId, className, variant = 'button' }: Props) {
  const href = mercadoId
    ? `/cliente/scan?mercadoId=${encodeURIComponent(mercadoId)}`
    : '/cliente/scan';

  if (variant === 'link') {
    return (
      <Link
        href={href}
        className={cn(
          'inline-flex items-center gap-1.5 text-sm font-semibold text-precivox-blue hover:underline',
          className
        )}
      >
        <ScanLine className="h-4 w-4" />
        Escanear etiqueta
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-900 shadow-sm hover:bg-violet-100',
        className
      )}
    >
      <ScanLine className="h-4 w-4" />
      Scan inteligente
    </Link>
  );
}
