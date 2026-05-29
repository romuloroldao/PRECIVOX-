'use client';

import { BadgeCheck, ShieldCheck } from 'lucide-react';

interface Props {
  selo: string | null;
  seloCurto?: string | null;
  compact?: boolean;
  className?: string;
}

export function MercadoSeloBadge({ selo, seloCurto, compact, className = '' }: Props) {
  if (!selo) return null;

  const label = seloCurto ?? selo;
  const verificado = selo.toLowerCase().includes('verificado');
  const Icon = verificado ? BadgeCheck : ShieldCheck;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${
        verificado
          ? 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200'
          : 'bg-indigo-100 text-indigo-900 ring-1 ring-indigo-200'
      } ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'} ${className}`}
      title={selo}
    >
      <Icon className={compact ? 'h-3 w-3 shrink-0' : 'h-3.5 w-3.5 shrink-0'} aria-hidden />
      {label}
    </span>
  );
}
