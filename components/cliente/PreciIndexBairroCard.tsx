'use client';

import { useEffect, useState } from 'react';
import { Activity, TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface Props {
  mercadoId: string | null;
}

export function PreciIndexBairroCard({ mercadoId }: Props) {
  const [data, setData] = useState<{
    indiceValor: number | null;
    variacaoPct: number | null;
    valorCestaRegional: number;
    regiao: { label: string };
    cobertura: { encontrados: number; total: number };
    explicacao: string;
  } | null>(null);

  useEffect(() => {
    if (!mercadoId) return;
    void (async () => {
      const res = await fetch(`/api/cliente/preci-index?mercadoId=${mercadoId}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    })();
  }, [mercadoId]);

  if (!mercadoId || !data || data.cobertura.encontrados < 3) return null;

  const Icon =
    data.variacaoPct != null && data.variacaoPct > 2
      ? TrendingUp
      : data.variacaoPct != null && data.variacaoPct < -2
        ? TrendingDown
        : Minus;

  return (
    <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-violet-600" />
        <h3 className="font-semibold text-gray-900">PRECI Index do bairro</h3>
      </div>
      <div className="mt-3 flex items-end gap-3">
        <p className="text-3xl font-bold text-violet-800">
          {data.indiceValor != null ? data.indiceValor.toFixed(1) : '100'}
        </p>
        <div className="flex items-center gap-1 text-sm text-gray-600 pb-1">
          <Icon className="h-4 w-4" />
          {data.variacaoPct != null ? (
            <span>
              {data.variacaoPct > 0 ? '+' : ''}
              {data.variacaoPct}% vs mês anterior
            </span>
          ) : (
            <span>cesta ~R$ {data.valorCestaRegional.toFixed(2).replace('.', ',')}</span>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-600">
        {data.explicacao.split('.')[0]}. {data.regiao.label} · {data.cobertura.encontrados} itens
        essenciais.
      </p>
    </div>
  );
}
