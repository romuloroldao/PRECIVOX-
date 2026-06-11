'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

type ReputacaoMercado = {
  score: number;
  rotulo: string;
  confirmacoes48h: number;
  contribuidoresAtivos: number;
};

export function MercadoCrowdReputacaoChip({ mercadoId }: { mercadoId: string | null }) {
  const [data, setData] = useState<ReputacaoMercado | null>(null);

  useEffect(() => {
    if (!mercadoId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/public/crowd-reputacao-mercado?mercadoId=${encodeURIComponent(mercadoId)}`,
          { cache: 'no-store' }
        );
        const json = await res.json();
        if (!cancelled && json.success) setData(json.data);
      } catch {
        if (!cancelled) setData(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mercadoId]);

  if (!data || data.score <= 0) return null;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-900 ring-1 ring-indigo-100"
      title={`${data.confirmacoes48h} confirmações · ${data.contribuidoresAtivos} contribuidores (48h)`}
    >
      <Users className="h-3 w-3" />
      {data.rotulo}
    </span>
  );
}
