'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  mercadoId: string | null;
}

export function TrocaHistoricoCard({ mercadoId }: Props) {
  const [historico, setHistorico] = useState<
    {
      produtoOrigemNome: string;
      substitutoNome: string;
      modo: string;
    }[]
  >([]);

  useEffect(() => {
    if (!mercadoId) return;
    void (async () => {
      try {
        const res = await fetch(
          `/api/cliente/troca-inteligente/historico?mercadoId=${mercadoId}`,
          { credentials: 'include', cache: 'no-store' }
        );
        const json = await res.json();
        if (json.success && json.data.historico?.length) {
          setHistorico(json.data.historico);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [mercadoId]);

  if (!mercadoId || historico.length === 0) return null;

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50/80 p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-5 w-5 text-teal-700" />
        <h3 className="font-semibold text-teal-950">Suas trocas recentes</h3>
      </div>
      <ul className="mt-2 space-y-1.5">
        {historico.slice(0, 4).map((h, i) => (
          <li key={i} className="text-xs text-teal-900">
            <span className="font-medium">{h.produtoOrigemNome}</span>
            <span className="text-teal-700"> → </span>
            <span className="font-medium">{h.substitutoNome}</span>
            <span className="text-teal-600/80"> ({h.modo})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
