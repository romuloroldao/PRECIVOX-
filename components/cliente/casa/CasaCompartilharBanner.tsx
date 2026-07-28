'use client';

import Link from 'next/link';
import { Home, X } from 'lucide-react';
import { useSession } from '@/lib/hooks/useUnifiedSession';
import { useLista } from '@/app/context/ListaContext';
import { useRaioFamiliar } from '@/app/hooks/useRaioFamiliar';
import { CASA } from '@/lib/ux-copy-casa';
import {
  CASA_SUGESTAO_MIN_ITENS_LISTA,
  CASA_SUGESTAO_SNOOZE_KEY,
  CASA_SUGESTAO_SNOOZE_MS,
} from '@/lib/raio-familiar-constants';
import { useCallback, useEffect, useState } from 'react';

function snoozed(): boolean {
  if (typeof window === 'undefined') return true;
  const raw = localStorage.getItem(CASA_SUGESTAO_SNOOZE_KEY);
  if (!raw) return false;
  const until = parseInt(raw, 10);
  return Number.isFinite(until) && Date.now() < until;
}

export function CasaCompartilharBanner({ className = '' }: { className?: string }) {
  const { status } = useSession();
  const { totalItens } = useLista();
  const { data, loading } = useRaioFamiliar(status === 'authenticated');
  const [oculto, setOculto] = useState(true);

  const elegivel = useCallback(() => {
    if (status !== 'authenticated') return false;
    if (loading || data?.ativo) return false;
    if (totalItens < CASA_SUGESTAO_MIN_ITENS_LISTA) return false;
    if (snoozed()) return false;
    return true;
  }, [status, loading, data?.ativo, totalItens]);

  useEffect(() => {
    setOculto(!elegivel());
  }, [elegivel]);

  const dismiss = () => {
    localStorage.setItem(CASA_SUGESTAO_SNOOZE_KEY, String(Date.now() + CASA_SUGESTAO_SNOOZE_MS));
    setOculto(true);
  };

  if (oculto) return null;

  return (
    <div
      className={`relative rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 shadow-sm ${className}`}
      role="region"
      aria-label={CASA.banner.titulo}
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-2 rounded-full p-1.5 text-gray-400 hover:bg-white hover:text-gray-600"
        aria-label={CASA.banner.dismiss}
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex gap-3 pr-8">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Home className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-indigo-950">{CASA.banner.titulo}</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            {CASA.banner.descricao(totalItens)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/cliente/familia"
              className="inline-flex rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              {CASA.banner.cta}
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-white"
            >
              {CASA.banner.dismiss}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
