'use client';

import { useEffect, useState } from 'react';
import { Anchor } from 'lucide-react';

interface Props {
  mercadoId: string | null;
}

type Resumo = {
  ativo: boolean;
  regiaoDescricao?: string;
  regiaoCompleta?: boolean;
  explicacao?: string;
  parceiros?: { nome: string; tipoLabel: string; selo: string | null }[];
};

export function ParceiroAncoraRegiaoChip({ mercadoId }: Props) {
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
        const res = await fetch(`/api/cliente/parceiros-ancora?${q}`, { cache: 'no-store' });
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

  if (!resumo?.ativo || !resumo.parceiros?.length) return null;

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-xs text-indigo-950">
      <p className="flex items-center gap-1 font-semibold">
        <Anchor className="h-3.5 w-3.5" />
        Rede piloto — parceiros âncora
        {resumo.regiaoCompleta ? '' : ' (em expansão)'}
      </p>
      <p className="mt-1 leading-snug text-indigo-900/85">{resumo.explicacao}</p>
      <ul className="mt-1.5 space-y-0.5 text-indigo-900/90">
        {resumo.parceiros.slice(0, 3).map((p) => (
          <li key={p.nome}>
            · {p.nome} — {p.tipoLabel}
            {p.selo ? ` (${p.selo})` : ''}
          </li>
        ))}
        {(resumo.parceiros.length ?? 0) > 3 && (
          <li className="text-indigo-700/80">+ {resumo.parceiros!.length - 3} parceiro(s)</li>
        )}
      </ul>
    </div>
  );
}
