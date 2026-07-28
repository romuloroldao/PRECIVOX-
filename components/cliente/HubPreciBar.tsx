'use client';

import Link from 'next/link';
import { Mic, ScanLine, Search } from 'lucide-react';
import { UX } from '@/lib/ux-copy';
import { cn } from '@/lib/utils';

/**
 * Hub PRECI — barra de entrada (Fase 1 placeholder).
 * Não é chatbot. Copy de tarefa; multimodal chega nas fases 4–8.
 */
export function HubPreciBar({
  className,
  onFocusNavigate = '/cliente/busca',
}: {
  className?: string;
  /** Por enquanto o foco leva à busca (capability). Fase 4: sheet do Hub. */
  onFocusNavigate?: string;
}) {
  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white p-3 shadow-sm', className)}>
      <Link
        href={onFocusNavigate}
        className="flex min-h-[48px] items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-left transition-colors hover:bg-slate-100"
      >
        <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
        <span className="flex-1 text-sm text-slate-500">{UX.hub.placeholder}</span>
        <span className="flex shrink-0 items-center gap-1 text-slate-400" aria-hidden>
          <Mic className="h-4 w-4 opacity-50" />
          <ScanLine className="h-4 w-4" />
        </span>
      </Link>
      <p className="mt-2 px-1 text-[11px] leading-snug text-slate-400">{UX.casaAgora.hubDica}</p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <HubChip href="/cliente/compra" label={UX.hub.chips.semana} />
        <HubChip href="/cliente/busca" label={UX.hub.chips.adicionar} />
        <HubChip href="/cliente/mercado-vivo" label={UX.hub.chips.mercado} />
        <HubChip href="/cliente/scan" label={UX.hub.chips.escanear} />
      </div>
    </div>
  );
}

function HubChip({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
    >
      {label}
    </Link>
  );
}
