'use client';

import { useEffect, useRef, useState } from 'react';
import { BottomSheet } from '@/components/ui';
import { ChevronLeft, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLista } from '@/app/context/ListaContext';
import { useIsDesktopLg } from '@/hooks/useMediaQuery';
import {
  ListaInteligentePanel,
  ListaInteligenteHeaderBlock,
} from '@/components/ListaInteligentePanel';

interface ListaLateralProps {
  expandida: boolean;
  onToggle: () => void;
}

/**
 * Mobile (< lg): FAB + drawer overlay.
 * Desktop (≥ lg): coluna fixa ao lado do conteúdo (sem overlay) ou trilho recolhido.
 */
export function ListaLateral({ expandida, onToggle }: ListaLateralProps) {
  const { totalItens, total, ultimoItemAdicionado, limparUltimoItem } = useLista();
  const isDesktop = useIsDesktopLg();
  const [pulsando, setPulsando] = useState(false);
  const [badgePop, setBadgePop] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ultimoItemAdicionado) return;

    setPulsando(true);
    setBadgePop(true);

    timerRef.current = setTimeout(() => {
      setPulsando(false);
      setBadgePop(false);
      limparUltimoItem();
    }, 600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [ultimoItemAdicionado, limparUltimoItem]);

  return (
    <>
      {/* Mobile: FAB quando lista fechada */}
      {!expandida && (
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'fixed right-4 z-50 flex items-center justify-center rounded-full bg-precivox-blue p-4 text-white shadow-lg transition-all hover:bg-blue-700 md:bottom-6 lg:hidden',
            'bottom-[var(--cliente-fab-bottom)]',
            pulsando && 'animate-pulse-ring'
          )}
          title="Ver lista inteligente"
          aria-label="Abrir lista inteligente de compras"
        >
          <ShoppingCart className="h-6 w-6" />
          {totalItens > 0 && (
            <span
              className={cn(
                'absolute -right-1 -top-1 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-emerald-500 px-1 text-xs font-bold text-white',
                badgePop && 'animate-badge-pop'
              )}
            >
              {totalItens > 99 ? '99+' : totalItens}
            </span>
          )}
        </button>
      )}

      {/* Mobile: bottom sheet */}
      {expandida && !isDesktop && (
        <BottomSheet
          id="lista-inteligente-panel"
          isOpen={expandida}
          onClose={onToggle}
          maxHeight="92vh"
          innerNoPadding
          innerClassName="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f4f6f8] p-0"
        >
          <ListaInteligentePanel variant="drawer" onClose={onToggle} />
        </BottomSheet>
      )}

      {/* Desktop: coluna expandida — empurra o grid, nunca sobrepõe */}
      {expandida && (
        <aside
          id="lista-inteligente-panel"
          className={cn(
            'hidden shrink-0 overflow-hidden border-l border-gray-200/80 bg-bg-paper shadow-[-4px_0_16px_rgba(0,0,0,0.04)]',
            'lg:flex lg:h-full lg:min-h-0 lg:w-[min(400px,32vw)] lg:flex-col lg:self-stretch xl:w-[420px] 2xl:w-[440px]'
          )}
          aria-label="Lista inteligente de compras"
        >
          <ListaInteligentePanel variant="inline" onClose={onToggle} />
        </aside>
      )}

      {/* Desktop: trilho recolhido — mantém lista acessível sem ocupar coluna inteira */}
      {!expandida && (
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'group hidden shrink-0 flex-col items-center gap-2 border-l border-gray-200/80 bg-white px-2 py-6 shadow-[-2px_0_8px_rgba(0,0,0,0.04)] transition-colors hover:bg-emerald-50/60',
            'lg:sticky lg:top-0 lg:z-10 lg:flex lg:w-14 lg:self-start lg:max-h-[calc(100dvh-4rem)] xl:w-16',
            pulsando && 'animate-pulse-ring'
          )}
          aria-label="Abrir lista inteligente de compras"
          aria-expanded={false}
          aria-controls="lista-inteligente-panel"
        >
          <ShoppingCart className="h-5 w-5 text-emerald-600 transition-transform group-hover:scale-110" />
          {totalItens > 0 ? (
            <>
              <span
                className={cn(
                  'flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-bold text-white',
                  badgePop && 'animate-badge-pop'
                )}
              >
                {totalItens > 99 ? '99+' : totalItens}
              </span>
              <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Lista
              </span>
              <span className="mt-auto text-[10px] font-bold tabular-nums text-emerald-700 [writing-mode:vertical-rl] rotate-180">
                R$ {total.toFixed(0)}
              </span>
            </>
          ) : (
            <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-medium text-gray-400">
              Abrir
            </span>
          )}
          <ChevronLeft className="mt-1 h-4 w-4 text-gray-400" aria-hidden />
        </button>
      )}
    </>
  );
}
