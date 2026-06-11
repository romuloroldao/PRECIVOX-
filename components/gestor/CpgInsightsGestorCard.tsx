'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Lock, RefreshCw } from 'lucide-react';

interface Props {
  mercadoId?: string;
}

type Cat = {
  categoria: string;
  sinais: number;
  usuariosUnicos: number;
  tendencia: string;
  pressao: string;
};

type Payload = {
  regiaoDescricao: string;
  categorias: Cat[];
  topMarcas: { marca: string; sinais: number }[];
  explicacao: string;
  lgpd: string;
};

export function CpgInsightsGestorCard({ mercadoId }: Props) {
  const [data, setData] = useState<Payload | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    setUpgrade(false);
    const q = new URLSearchParams();
    if (mercadoId) q.set('mercadoId', mercadoId);
    try {
      const res = await fetch(`/api/gestor/monetizacao/cpg-insights?${q}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else if (json.upgrade) setUpgrade(true);
    } finally {
      setLoading(false);
    }
  }, [mercadoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
        Carregando insights CPG…
      </div>
    );
  }

  if (upgrade) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
        <p className="flex items-center gap-2 font-semibold">
          <Lock className="h-4 w-4" />
          Insights CPG — plano Enterprise
        </p>
        <p className="mt-1 text-xs text-amber-900/80">
          Tendências agregadas por categoria e marca para indústria (LGPD). Disponível no upgrade
          Enterprise.
        </p>
      </div>
    );
  }

  if (!data?.categorias?.length) return null;

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
      <div className="flex items-start justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-violet-950">
          <BarChart3 className="h-4 w-4" />
          Insights CPG — {data.regiaoDescricao}
        </h3>
        <button type="button" onClick={() => void carregar()} className="p-1 text-violet-700">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 text-xs text-violet-900/80">{data.explicacao}</p>
      <ul className="mt-2 space-y-1 text-xs text-violet-950">
        {data.categorias.slice(0, 5).map((c) => (
          <li key={c.categoria}>
            · {c.categoria} — {c.sinais} sinais ({c.tendencia}, {c.pressao})
          </li>
        ))}
      </ul>
      {data.topMarcas.length > 0 && (
        <p className="mt-2 text-[11px] text-violet-800/70">
          Marcas: {data.topMarcas.slice(0, 3).map((m) => m.marca).join(', ')}
        </p>
      )}
      <p className="mt-2 text-[10px] text-violet-700/70">{data.lgpd}</p>
    </div>
  );
}
