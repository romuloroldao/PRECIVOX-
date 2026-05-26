'use client';

import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';

interface Props {
  mercadoId?: string;
}

export function RadarDemandaCard({ mercadoId }: Props) {
  const [data, setData] = useState<{
    itens: { nome: string; listasAtivas: number; pressao: string; categoria: string | null }[];
    explicacao: string;
    totalSinais: number;
  } | null>(null);

  useEffect(() => {
    const q = mercadoId ? `?mercadoId=${mercadoId}` : '';
    void (async () => {
      const res = await fetch(`/api/gestor/radar-demanda${q}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) setData(json.data);
    })();
  }, [mercadoId]);

  if (!data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
        Carregando radar de demanda…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
      <div className="flex items-center gap-2">
        <Radio className="h-5 w-5 text-indigo-700" />
        <h3 className="font-semibold text-indigo-950">Radar de demanda do bairro</h3>
      </div>
      <p className="mt-1 text-xs text-indigo-800/90">{data.explicacao}</p>
      <p className="text-[11px] text-indigo-600">{data.totalSinais} sinais no período</p>
      {data.itens.length === 0 ? (
        <p className="mt-3 text-sm text-gray-600">Ainda poucos sinais — incentive clientes a usar listas.</p>
      ) : (
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {data.itens.map((item) => (
            <li
              key={item.nome}
              className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">{item.nome}</p>
                {item.categoria && (
                  <p className="text-[11px] text-gray-500">{item.categoria}</p>
                )}
              </div>
              <span
                className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  item.pressao === 'ALTA'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {item.listasAtivas} listas
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
