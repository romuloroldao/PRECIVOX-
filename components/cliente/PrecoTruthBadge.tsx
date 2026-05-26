'use client';

import { labelConfianca, labelFrescorPreco } from '@/lib/estoque-truth';
import { cn } from '@/lib/utils';
import { ShieldCheck, Clock } from 'lucide-react';

export interface PrecoTruthBadgeProps {
  verificadoEm?: string | Date | null;
  atualizadoEm?: string | Date | null;
  confianca?: number;
  fonte?: string;
  compact?: boolean;
  className?: string;
}

export function PrecoTruthBadge({
  verificadoEm,
  atualizadoEm,
  confianca = 70,
  fonte,
  compact = false,
  className,
}: PrecoTruthBadgeProps) {
  const vEm = verificadoEm ? new Date(verificadoEm) : null;
  const aEm = atualizadoEm ? new Date(atualizadoEm) : new Date();
  const frescor = labelFrescorPreco(vEm, aEm);
  const nivel = labelConfianca(confianca);

  const nivelStyles = {
    alta: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    media: 'bg-sky-50 text-sky-800 ring-sky-200',
    baixa: 'bg-amber-50 text-amber-900 ring-amber-200',
  };

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset',
          nivelStyles[nivel],
          className
        )}
        title={fonte ? `Fonte: ${fonte}` : undefined}
      >
        <Clock className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
        {frescor}
      </span>
    );
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
          nivelStyles[nivel]
        )}
      >
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        Confiança {confianca}%
      </span>
      <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
        <Clock className="h-3.5 w-3.5" aria-hidden />
        {frescor}
      </span>
    </div>
  );
}
