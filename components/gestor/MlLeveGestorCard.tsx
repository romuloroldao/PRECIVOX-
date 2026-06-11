'use client';

import { useCallback, useEffect, useState } from 'react';
import { Brain, Loader2, RefreshCw, Users, TrendingDown } from 'lucide-react';

interface Props {
  mercadoId?: string;
  compact?: boolean;
}

export function MlLeveGestorCard({ mercadoId, compact = false }: Props) {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [data, setData] = useState<{
    usuariosAnalisados: number;
    churnAlto: number;
    churnMedio: number;
    elasticidadeMedia: number;
    explicacao: string;
    acoesSugeridas: string[];
  } | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    const q = new URLSearchParams();
    if (mercadoId) q.set('mercadoId', mercadoId);
    try {
      const res = await fetch(`/api/gestor/ml-leve?${q}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setErro(json.error ?? 'Erro ao carregar ML leve');
    } catch {
      setErro('Erro de rede');
    } finally {
      setLoading(false);
    }
  }, [mercadoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando ML leve (churn + elasticidade)…
      </div>
    );
  }

  if (erro) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">{erro}</div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-indigo-700" />
          <h3 className="font-semibold text-indigo-950">ML leve — retenção (Épico 12)</h3>
        </div>
        <button
          type="button"
          onClick={() => void carregar()}
          className="rounded-lg p-1.5 text-indigo-700 hover:bg-indigo-100"
          aria-label="Atualizar"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 text-xs text-indigo-900/75">{data.explicacao}</p>

      <div className={`mt-3 grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
        <div className="rounded-lg bg-white/80 px-3 py-2 ring-1 ring-indigo-100">
          <p className="text-[10px] font-medium uppercase text-gray-500">Analisados</p>
          <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
            <Users className="h-4 w-4 text-indigo-600" />
            {data.usuariosAnalisados}
          </p>
        </div>
        <div className="rounded-lg bg-white/80 px-3 py-2 ring-1 ring-red-100">
          <p className="text-[10px] font-medium uppercase text-gray-500">Churn alto</p>
          <p className="text-lg font-bold text-red-700">{data.churnAlto}</p>
        </div>
        <div className="rounded-lg bg-white/80 px-3 py-2 ring-1 ring-amber-100">
          <p className="text-[10px] font-medium uppercase text-gray-500">Churn médio</p>
          <p className="text-lg font-bold text-amber-700">{data.churnMedio}</p>
        </div>
        <div className="rounded-lg bg-white/80 px-3 py-2 ring-1 ring-indigo-100">
          <p className="text-[10px] font-medium uppercase text-gray-500">Elasticidade média</p>
          <p className="text-lg font-bold text-indigo-900 flex items-center gap-1">
            <TrendingDown className="h-4 w-4" />
            {data.elasticidadeMedia}
          </p>
        </div>
      </div>

      {!compact && data.acoesSugeridas.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-gray-700">
          {data.acoesSugeridas.map((a) => (
            <li key={a}>• {a}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
