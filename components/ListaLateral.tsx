'use client';

import { Drawer } from '@/components/ui';
import { ShoppingCart } from 'lucide-react';
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
 * Mobile (&lt; lg): drawer com overlay. Desktop: coluna lateral que empurra o grid (sem overlay).
 */
export function ListaLateral({ expandida, onToggle }: ListaLateralProps) {
  const { totalItens } = useLista();
  const isDesktop = useIsDesktopLg();

  if (!expandida) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'fixed bottom-6 right-4 z-40 flex items-center justify-center rounded-full bg-precivox-blue p-4 text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-md lg:hidden'
        )}
        title="Abrir lista inteligente"
        aria-label="Abrir lista inteligente de compras"
      >
        <ShoppingCart className="h-6 w-6" />
        {totalItens > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-emerald-600 px-1 text-xs font-bold text-white">
            {totalItens > 99 ? '99+' : totalItens}
          </span>
        )}
      </button>
    );
  }

  if (isDesktop) {
    return (
      <aside
        id="lista-inteligente-panel"
        className="relative hidden h-full min-h-0 w-full max-w-md shrink-0 flex-col overflow-hidden rounded-l-2xl border-y border-l border-gray-300/50 lg:flex"
        aria-label="Lista inteligente de compras"
      >
        <ListaInteligentePanel variant="inline" onClose={onToggle} />
      </aside>
    );
  }

  return (
    <Drawer
      id="lista-inteligente-panel"
      isOpen={expandida}
      onClose={onToggle}
      position="right"
      size="lg"
      titleBarClassName="border-0 bg-gradient-to-br from-emerald-600 to-emerald-700 p-0 text-white shadow-md"
      innerClassName="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f4f6f8] p-0"
      title={<ListaInteligenteHeaderBlock onClose={onToggle} showCloseButton={false} />}
      drawerClassName="border-l border-emerald-900/10 max-h-[100dvh]"
      closeButtonClassName="text-white hover:bg-white/15"
      overlayClassName="bg-black/55 backdrop-blur-[2px]"
    >
      <ListaInteligentePanel variant="drawer" omitHeader onClose={onToggle} />
    </Drawer>
  );
}
