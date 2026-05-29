'use client';

import { useEffect, useState } from 'react';
import { Clock, Zap } from 'lucide-react';
import type { RecomendacaoTiming } from '@/lib/espera-que-vale';
import { useLazyVisible } from '@/app/hooks/useLazyVisible';
import { enqueueClientFetch } from '@/lib/client-api-queue';

interface Props {
  produtoId: string | undefined;
  mercadoId: string;
}

export function EsperaQueValeChip({ produtoId, mercadoId }: Props) {
  const { ref, visible } = useLazyVisible();
  const [hint, setHint] = useState<{
    recomendacao: RecomendacaoTiming;
    mensagem: string;
  } | null>(null);

  useEffect(() => {
    if (!visible || !produtoId || !mercadoId) return;
    let cancelled = false;
    void enqueueClientFetch(async () => {
      const res = await fetch(
        `/api/cliente/espera-que-vale?mercadoId=${mercadoId}&produtoId=${produtoId}`,
        { credentials: 'include', cache: 'no-store' }
      );
      if (!res.ok) return null;
      return res.json();
    })
      .then((json) => {
        if (cancelled || !json?.success || json.data.recomendacao === 'neutro') return;
        setHint({
          recomendacao: json.data.recomendacao,
          mensagem: json.data.mensagem,
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

  const esperar = hint.recomendacao === 'esperar';
  const Icon = esperar ? Clock : Zap;

  return (
    <p
      className={`mt-1 flex items-start gap-1 text-[11px] leading-snug ${
        esperar ? 'text-amber-800' : 'text-emerald-800'
      }`}
      title={hint.mensagem}
    >
      <Icon className="mt-0.5 h-3 w-3 shrink-0" />
      <span>{hint.mensagem}</span>
    </p>
  );
}
