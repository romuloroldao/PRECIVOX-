'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { UX } from '@/lib/ux-copy';

/**
 * Espelho opcional “por quê?” — Fase 7 (PRECI silencioso).
 * Explicável, sem jargão de IA.
 */
export function PreciPorQueEspelho({
  linhas,
  className,
}: {
  /** Explicações humanas (ex.: eixos PRECI ou fatores de intent). */
  linhas: string[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!linhas.length) return null;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        aria-expanded={open}
      >
        {UX.perfil.porQue}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
          {linhas.map((l) => (
            <li key={l} className="leading-snug">
              {l}
            </li>
          ))}
          <li className="pt-1">
            <Link href="/cliente/perfil" className="font-semibold text-primary-700 hover:underline">
              {UX.perfil.ajustarPrefs}
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
