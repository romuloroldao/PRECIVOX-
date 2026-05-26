'use client';

import { useState } from 'react';
import { Check, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrecoCrowdActionsProps {
  estoqueId: string;
  precoExibido: number;
  className?: string;
  onFeedback?: (confianca: number) => void;
}

export function PrecoCrowdActions({
  estoqueId,
  precoExibido,
  className,
  onFeedback,
}: PrecoCrowdActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const enviar = async (tipo: 'confirmado' | 'mais_caro' | 'mais_barato') => {
    if (done || loading) return;
    setLoading(tipo);
    setMsg(null);
    try {
      const res = await fetch('/api/produtos/preco-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          estoqueId,
          tipo,
          precoVisto: precoExibido,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Falha ao enviar');
      }
      setMsg(json.data?.mensagem ?? 'Registrado!');
      setDone(true);
      onFeedback?.(json.data?.confianca ?? 70);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erro ao enviar');
    } finally {
      setLoading(null);
    }
  };

  if (done && msg) {
    return (
      <p className={cn('mt-2 text-xs font-medium text-emerald-800', className)}>{msg}</p>
    );
  }

  return (
    <div className={cn('mt-3 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5', className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
        Este preço na prateleira?
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={!!loading}
          onClick={() => void enviar('confirmado')}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading === 'confirmado' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Certo
        </button>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => void enviar('mais_caro')}
          className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 ring-1 ring-slate-200 hover:bg-slate-100 disabled:opacity-60"
        >
          {loading === 'mais_caro' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <TrendingUp className="h-3.5 w-3.5" />
          )}
          Mais caro
        </button>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => void enviar('mais_barato')}
          className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 ring-1 ring-slate-200 hover:bg-slate-100 disabled:opacity-60"
        >
          {loading === 'mais_barato' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          Mais barato
        </button>
      </div>
      {msg && !done && <p className="mt-1.5 text-xs text-red-600">{msg}</p>}
    </div>
  );
}
