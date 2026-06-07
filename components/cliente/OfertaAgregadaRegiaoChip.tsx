'use client';

import { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';

interface Props {
  mercadoId: string | null;
}

type Resumo = {
  ativo: boolean;
  mercadoNome?: string;
  regiaoDescricao?: string;
  consumidoresUnicos?: number;
  topItens?: { nome: string; sinais: number; preco: number | null }[];
  explicacao?: string;
};

export function OfertaAgregadaRegiaoChip({ mercadoId }: Props) {
  const [resumo, setResumo] = useState<Resumo | null>(null);

  useEffect(() => {
    if (!mercadoId) {
      setResumo(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const q = new URLSearchParams({ mercadoId });
        const res = await fetch(`/api/cliente/oferta-agregada?${q}`, { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled && json.success) setResumo(json.data);
      } catch {
        if (!cancelled) setResumo(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mercadoId]);

  if (!resumo?.ativo || !resumo.topItens?.length) return null;

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50/70 px-3 py-2 text-xs text-teal-950">
      <p className="flex items-center gap-1 font-semibold">
        <Layers className="h-3.5 w-3.5" />
        Oferta agregada ativa — {resumo.mercadoNome}
      </p>
      <p className="mt-1 leading-snug text-teal-900/85">{resumo.explicacao}</p>
      <ul className="mt-1.5 space-y-0.5 text-teal-900/90">
        {resumo.topItens.slice(0, 3).map((i) => (
          <li key={i.nome}>
            · {i.nome}
            {i.preco != null ? ` — R$ ${i.preco.toFixed(2)}` : ''} ({i.sinais} sinais na região)
          </li>
        ))}
      </ul>
    </div>
  );
}
