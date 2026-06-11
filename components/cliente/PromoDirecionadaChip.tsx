'use client';

import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';

interface Props {
  mercadoId: string | null;
}

type Promo = {
  titulo: string;
  descontoPct: number;
  motivo: string;
  produtoNome?: string;
};

export function PromoDirecionadaChip({ mercadoId }: Props) {
  const [promos, setPromos] = useState<Promo[]>([]);

  useEffect(() => {
    if (!mercadoId) {
      setPromos([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const q = new URLSearchParams({ mercadoId });
        const res = await fetch(`/api/cliente/promo-direcionada?${q}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        const json = await res.json();
        if (!cancelled && json.success) setPromos(json.data.promos ?? []);
      } catch {
        if (!cancelled) setPromos([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mercadoId]);

  if (!promos.length) return null;

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/70 px-3 py-2 text-xs text-orange-950">
      <p className="flex items-center gap-1 font-semibold">
        <Megaphone className="h-3.5 w-3.5" />
        Promo para você
      </p>
      <ul className="mt-1.5 space-y-1 text-orange-900/90">
        {promos.slice(0, 2).map((p) => (
          <li key={p.titulo}>
            · {p.titulo} — {p.descontoPct}% off
            {p.produtoNome ? ` (${p.produtoNome})` : ''}
            <span className="block text-[10px] text-orange-800/70">{p.motivo}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
