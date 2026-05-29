'use client';

import { useEffect, useState } from 'react';
import { Package, ShoppingBag } from 'lucide-react';
import type { RecomendacaoFormato } from '@/lib/atacado-varejo';
import { useLazyVisible } from '@/app/hooks/useLazyVisible';
import { enqueueClientFetch } from '@/lib/client-api-queue';

interface Props {
  produtoId: string | undefined;
  mercadoId: string;
}

export function AtacadoVarejoChip({ produtoId, mercadoId }: Props) {
  const { ref, visible } = useLazyVisible();
  const [hint, setHint] = useState<{
    recomendacao: RecomendacaoFormato;
    mensagem: string;
    economiaPct: number;
  } | null>(null);

  useEffect(() => {
    if (!visible || !produtoId || !mercadoId) return;
    let cancelled = false;
    void enqueueClientFetch(async () => {
      const res = await fetch(
        `/api/cliente/atacado-varejo?mercadoId=${mercadoId}&produtoId=${produtoId}`,
        { credentials: 'include', cache: 'no-store' }
      );
      if (!res.ok) return null;
      return res.json();
    })
      .then((json) => {
        if (cancelled || !json?.success || json.data.recomendacao === 'indiferente') return;
        setHint({
          recomendacao: json.data.recomendacao,
          mensagem: json.data.mensagem,
          economiaPct: json.data.economiaPct,
        });
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [visible, produtoId, mercadoId]);

  if (!hint) {
    return <span ref={ref} className="sr-only" aria-hidden />;
  }

  const atacado = hint.recomendacao === 'atacado';
  const Icon = atacado ? Package : ShoppingBag;

  return (
    <p
      className={`mt-1 flex items-start gap-1 text-[11px] leading-snug ${
        atacado ? 'text-indigo-800' : 'text-slate-700'
      }`}
      title={hint.mensagem}
    >
      <Icon className="mt-0.5 h-3 w-3 shrink-0" />
      <span>
        {atacado ? 'Atacado' : 'Varejo'}: {hint.mensagem}
      </span>
    </p>
  );
}
