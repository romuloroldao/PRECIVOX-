'use client';

import { useEffect, useState } from 'react';
import { Clock, Zap } from 'lucide-react';
import type { RecomendacaoTiming } from '@/lib/espera-que-vale';

interface Props {
  produtoId: string | undefined;
  mercadoId: string;
}

export function EsperaQueValeChip({ produtoId, mercadoId }: Props) {
  const [hint, setHint] = useState<{
    recomendacao: RecomendacaoTiming;
    mensagem: string;
  } | null>(null);

  useEffect(() => {
    if (!produtoId || !mercadoId) return;
    void (async () => {
      try {
        const res = await fetch(
          `/api/cliente/espera-que-vale?mercadoId=${mercadoId}&produtoId=${produtoId}`,
          { credentials: 'include', cache: 'no-store' }
        );
        const json = await res.json();
        if (json.success && json.data.recomendacao !== 'neutro') {
          setHint({
            recomendacao: json.data.recomendacao,
            mensagem: json.data.mensagem,
          });
        }
      } catch {
        /* ignore */
      }
    })();
  }, [produtoId, mercadoId]);

  if (!hint) return null;

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
