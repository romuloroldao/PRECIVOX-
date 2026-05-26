'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  mercadoId: string | null;
}

export function InflacaoCestaCard({ mercadoId }: Props) {
  const [data, setData] = useState<{
    variacaoPct: number | null;
    mensagem: string;
    valorCestaAtual: number;
  } | null>(null);

  useEffect(() => {
    if (!mercadoId) return;
    void (async () => {
      const res = await fetch(`/api/cliente/inflacao-cesta?mercadoId=${mercadoId}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    })();
  }, [mercadoId]);

  if (!mercadoId || !data || data.valorCestaAtual <= 0) return null;

  const Icon =
    data.variacaoPct != null && data.variacaoPct > 3
      ? TrendingUp
      : data.variacaoPct != null && data.variacaoPct < -2
        ? TrendingDown
        : Minus;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-gray-700" />
        <h3 className="font-semibold text-gray-900">Inflação da sua cesta</h3>
      </div>
      <p className="mt-2 text-sm text-gray-600">{data.mensagem}</p>
      <p className="mt-1 text-xs text-gray-500">
        Estimativa atual: R$ {data.valorCestaAtual.toFixed(2).replace('.', ',')}
        {data.variacaoPct != null && ` · variação ~${data.variacaoPct}%`}
      </p>
    </div>
  );
}
