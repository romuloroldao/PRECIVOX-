'use client';

import { useEffect, useState } from 'react';
import {
  recordCompraConfirmada,
  recordCompraParcial,
  recordCompraNaoRealizada,
} from '@/lib/events/frontend-events';
import { ShoppingBag, X } from 'lucide-react';

const STORAGE_KEY = 'precivox_compra_prompt_snooze';

interface CompraConfirmacaoPromptProps {
  mercadoId: string | null;
  listaId?: string | null;
  itensCount: number;
  valorEstimado: number;
  /** Ex.: usuário saiu da busca com itens na lista */
  ativo: boolean;
}

export function CompraConfirmacaoPrompt({
  mercadoId,
  listaId,
  itensCount,
  valorEstimado,
  ativo,
}: CompraConfirmacaoPromptProps) {
  const [open, setOpen] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (!ativo || !mercadoId || itensCount < 1) {
      setOpen(false);
      return;
    }
    const snooze = localStorage.getItem(STORAGE_KEY);
    if (snooze && Date.now() < parseInt(snooze, 10)) return;

    const t = setTimeout(() => setOpen(true), 2500);
    return () => clearTimeout(t);
  }, [ativo, mercadoId, itensCount]);

  const fechar = (horasSnooze = 24) => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now() + horasSnooze * 60 * 60 * 1000));
  };

  const responder = async (tipo: 'sim' | 'parcial' | 'nao') => {
    if (!mercadoId) return;
    const userId =
      typeof window !== 'undefined' ? localStorage.getItem('userId') || 'anonymous' : 'anonymous';
    if (tipo === 'sim') {
      await recordCompraConfirmada(userId, mercadoId, {
        listaId: listaId ?? undefined,
        itensCount,
        valorEstimado,
      });
    } else if (tipo === 'parcial') {
      await recordCompraParcial(userId, mercadoId, {
        listaId: listaId ?? undefined,
        itensComprados: Math.max(1, Math.floor(itensCount / 2)),
        itensTotal: itensCount,
      });
    } else {
      await recordCompraNaoRealizada(userId, mercadoId, { listaId: listaId ?? undefined });
    }
    setEnviado(true);
    setTimeout(() => fechar(48), 1200);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-labelledby="compra-prompt-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-emerald-800">
            <ShoppingBag className="h-5 w-5" />
            <h2 id="compra-prompt-title" className="text-lg font-bold text-gray-900">
              Fechou a compra?
            </h2>
          </div>
          <button
            type="button"
            onClick={() => fechar()}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Em 10 segundos você melhora suas sugestões e ajuda o PRECIVOX a prever sua próxima lista.
        </p>
        {enviado ? (
          <p className="mt-4 text-sm font-medium text-emerald-700">Obrigado! Registrado.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => void responder('sim')}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Sim, comprei tudo
            </button>
            <button
              type="button"
              onClick={() => void responder('parcial')}
              className="w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Comprei em parte
            </button>
            <button
              type="button"
              onClick={() => void responder('nao')}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Não fui ao mercado
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
