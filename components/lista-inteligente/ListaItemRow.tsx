'use client';

import { Trash2 } from 'lucide-react';
import { Card, QuantityStepper } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { ItemLista } from '@/app/context/ListaContext';

interface ListaItemRowProps {
  item: ItemLista;
  index: number;
  onRemover: (item: ItemLista) => void;
  onAtualizarQtd: (id: string, qtd: number) => void;
  compact?: boolean;
}

export function ListaItemRow({
  item,
  index,
  onRemover,
  onAtualizarQtd,
  compact = false,
}: ListaItemRowProps) {
  const precoFinal =
    item.emPromocao && item.precoPromocional ? item.precoPromocional : item.preco;
  const pctOff =
    item.emPromocao && item.precoPromocional && item.preco > item.precoPromocional
      ? Math.round((1 - item.precoPromocional / item.preco) * 100)
      : null;

  return (
    <Card
      variant="default"
      className={cn(
        'border border-slate-200/80 bg-white',
        compact ? 'p-2.5 shadow-sm' : 'p-3 shadow-sm'
      )}
    >
      <div className={cn('flex', compact ? 'gap-2' : 'gap-3')}>
        <span
          className={cn(
            'shrink-0 font-bold tabular-nums text-slate-400',
            compact ? 'mt-1 w-4 text-center text-[10px]' : 'flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs text-primary-700'
          )}
        >
          {index + 1}
        </span>

        <div
          className={cn(
            'flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100',
            compact ? 'h-10 w-10' : 'h-14 w-14'
          )}
        >
          {item.imagem ? (
            <img src={item.imagem} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className={compact ? 'text-lg text-slate-400' : 'text-2xl text-slate-400'}>📦</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h4
            className={cn(
              'line-clamp-2 font-semibold leading-snug text-text-primary',
              compact ? 'text-xs' : 'text-sm'
            )}
          >
            {item.nome}
          </h4>
          <p className={cn('text-text-secondary', compact ? 'text-[10px]' : 'text-xs')}>
            {item.unidade.mercado.nome}
          </p>

          <div className={cn('flex flex-wrap items-center gap-1.5', compact ? 'mt-0.5' : 'mt-1')}>
            {item.emPromocao && item.precoPromocional ? (
              <>
                <span className={cn('font-bold text-emerald-600', compact ? 'text-xs' : 'text-sm')}>
                  R$ {item.precoPromocional.toFixed(2).replace('.', ',')}
                </span>
                {pctOff != null && pctOff > 0 && (
                  <span className="rounded bg-red-100 px-1 py-0.5 text-[9px] font-bold uppercase text-red-700">
                    -{pctOff}%
                  </span>
                )}
              </>
            ) : (
              <span className={cn('font-bold text-text-primary', compact ? 'text-xs' : 'text-sm')}>
                R$ {item.preco.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          <div className={cn('flex items-center gap-2', compact ? 'mt-1.5' : 'mt-2')}>
            <QuantityStepper
              value={item.quantidade}
              onChange={(q) => onAtualizarQtd(item.id, q)}
              size={compact ? 'sm' : 'md'}
              min={1}
            />
            <span
              className={cn(
                'ml-auto font-semibold tabular-nums text-text-secondary',
                compact ? 'text-[10px]' : 'text-xs'
              )}
            >
              R$ {(precoFinal * item.quantidade).toFixed(2).replace('.', ',')}
            </span>
            <button
              type="button"
              onClick={() => onRemover(item)}
              className={cn(
                'flex shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 active:scale-95',
                compact ? 'h-9 w-9 min-h-[44px] min-w-[44px]' : 'h-11 w-11'
              )}
              aria-label={`Remover ${item.nome}`}
            >
              <Trash2 className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
