'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  mercadoId: string | null;
}

export function RelatorioSemanaCard({ mercadoId }: Props) {
  const [data, setData] = useState<{
    resumo: string;
    oportunidades: { titulo: string; descricao: string }[];
  } | null>(null);

  useEffect(() => {
    if (!mercadoId) return;
    void (async () => {
      const res = await fetch(`/api/cliente/relatorio-semana?mercadoId=${mercadoId}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    })();
  }, [mercadoId]);

  if (!mercadoId || !data) return null;

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-sky-700" />
        <h3 className="font-semibold text-sky-950">Esta semana no PRECIVOX</h3>
      </div>
      <p className="mt-2 text-sm text-sky-900/90">{data.resumo}</p>
      {data.oportunidades.length > 0 && (
        <ul className="mt-3 space-y-2">
          {data.oportunidades.map((o, i) => (
            <li key={i} className="rounded-lg bg-white/80 px-3 py-2 text-xs">
              <p className="font-semibold text-gray-900">{o.titulo}</p>
              <p className="text-gray-600">{o.descricao}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
