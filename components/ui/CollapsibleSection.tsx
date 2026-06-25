'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  /** Texto curto que explica, em linguagem simples, o que há na seção. */
  description?: string;
  /** Inicia aberta? Por padrão fica fechada para reduzir excesso de informação. */
  defaultOpen?: boolean;
  /** Selo opcional, ex.: contagem de itens ou "Novo". */
  badge?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Seção que esconde conteúdo avançado atrás de um clique (divulgação progressiva).
 * Reduz a sobrecarga inicial mantendo os recursos fáceis de descobrir.
 */
export function CollapsibleSection({
  title,
  description,
  defaultOpen = false,
  badge,
  children,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className={cn('rounded-2xl border border-slate-200 bg-white', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-4 py-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold text-slate-900">{title}</h2>
            {badge && (
              <span className="shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-0.5 truncate text-sm text-slate-500">{description}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200',
            open && 'rotate-180'
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div id={panelId} className="flex flex-col gap-4 px-4 pb-4">
          {children}
        </div>
      )}
    </section>
  );
}
