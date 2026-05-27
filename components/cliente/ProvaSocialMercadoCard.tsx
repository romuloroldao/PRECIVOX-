'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

interface Props {
  mercadoId: string | null;
}

export function ProvaSocialMercadoCard({ mercadoId }: Props) {
  const [data, setData] = useState<{
    mensagemGeral: string;
    regiaoLabel: string;
    destaques: { mensagem: string; familiasUnicas: number }[];
  } | null>(null);

  useEffect(() => {
    if (!mercadoId) return;
    void (async () => {
      try {
        const res = await fetch(`/api/cliente/prova-social?mercadoId=${mercadoId}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        const json = await res.json();
        if (json.success && json.data?.familiasAtivasMercado >= 3) {
          setData(json.data);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [mercadoId]);

  if (!mercadoId || !data) return null;

  return (
    <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm">
      <div className="flex items-start gap-2">
        <Users className="h-5 w-5 shrink-0 text-sky-700" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sky-950">Prova social · {data.regiaoLabel}</h3>
          <p className="mt-1 text-xs text-sky-900/85">{data.mensagemGeral}</p>
          {data.destaques.length > 0 && (
            <ul className="mt-2 space-y-1">
              {data.destaques.slice(0, 3).map((d, i) => (
                <li key={i} className="text-[11px] text-gray-700">
                  {d.mensagem}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[10px] text-gray-500">
            Dados agregados e anônimos — nenhum vizinho é identificado.
          </p>
        </div>
      </div>
    </div>
  );
}
