'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronRight, MapPin, MoreHorizontal } from 'lucide-react';
import { UX } from '@/lib/ux-copy';
import { cn } from '@/lib/utils';

interface ListaFooterProps {
  total: number;
  itensCount: number;
  isCompact: boolean;
  confirmLimpar: boolean;
  onClose: () => void;
  onFinalizar: () => void;
  onEsvaziarClick: () => void;
  onCancelarEsvaziar: () => void;
  onConfirmarEsvaziar: () => void;
  onAbrirMenu: () => void;
}

export function ListaFooter({
  total,
  itensCount,
  isCompact,
  confirmLimpar,
  onClose,
  onFinalizar,
  onEsvaziarClick,
  onCancelarEsvaziar,
  onConfirmarEsvaziar,
  onAbrirMenu,
}: ListaFooterProps) {
  return (
    <div
      className={cn(
        'relative z-10 shrink-0 border-t border-slate-200 bg-bg-paper shadow-[0_-4px_16px_rgba(15,23,42,0.06)]',
        isCompact ? 'px-3 pb-2 pt-2' : 'px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4'
      )}
    >
      <div className={cn('flex items-center justify-between gap-2', isCompact ? 'pb-2' : 'pb-3')}>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Total estimado
          </span>
          <p
            className={cn(
              'font-bold tabular-nums text-emerald-600',
              isCompact ? 'text-lg leading-tight' : 'text-2xl'
            )}
          >
            R$ {total.toFixed(2).replace('.', ',')}
          </p>
          {itensCount > 0 && (
            <p className="text-xs text-slate-500">{UX.lista.itens(itensCount)}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onAbrirMenu}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          aria-label="Mais opções da lista"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className={cn('space-y-2', isCompact ? 'mt-1' : 'mt-2')}>
        {itensCount > 0 ? (
          <Link
            href="/cliente/mercado-vivo"
            onClick={onFinalizar}
            className={cn(
              'group flex w-full items-center gap-3 rounded-xl bg-emerald-600 text-left text-white shadow-sm transition-colors hover:bg-emerald-700',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
              isCompact ? 'px-3 py-2.5' : 'px-4 py-3'
            )}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
              <MapPin className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn('block font-semibold leading-tight', isCompact ? 'text-sm' : 'text-base')}>
                {UX.lista.finalizarCompras}
              </span>
              <span className="block text-xs text-emerald-50/90">
                {UX.lista.finalizarComprasDescricao}
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-emerald-100 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-center text-xs text-slate-500">
            {UX.lista.irCorredorVazio}
          </p>
        )}

        {confirmLimpar ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="flex-1 text-xs font-medium text-red-800">
              {UX.lista.confirmarEsvaziar}
            </p>
            <button
              type="button"
              onClick={onConfirmarEsvaziar}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              {UX.lista.esvaziar}
            </button>
            <button
              type="button"
              onClick={onCancelarEsvaziar}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700"
            >
              {UX.geral.cancelar}
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="flex w-full items-center justify-center gap-1.5 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {UX.lista.continuarComprando}
        </button>
      </div>
    </div>
  );
}
