'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Radio, RefreshCw } from 'lucide-react';

interface Props {
  mercadoId?: string;
}

type RadarItem = {
  produtoId: string;
  nome: string;
  listasAtivas: number;
  buscasRecentes: number;
  pressao: string;
  categoria: string | null;
};

type RadarData = {
  itens: RadarItem[];
  termosBusca: { termo: string; ocorrencias: number }[];
  explicacao: string;
  totalSinais: number;
  periodoDias: number;
};

const PERIODOS = [7, 14, 30] as const;

export function RadarDemandaCard({ mercadoId }: Props) {
  const [dias, setDias] = useState<(typeof PERIODOS)[number]>(7);
  const [data, setData] = useState<RadarData | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    const q = new URLSearchParams({ dias: String(dias) });
    if (mercadoId) q.set('mercadoId', mercadoId);
    try {
      const res = await fetch(`/api/gestor/radar-demanda?${q}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setErro(json.error ?? 'Não foi possível carregar o radar');
        setData(null);
      }
    } catch {
      setErro('Erro de rede ao carregar radar');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [mercadoId, dias]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
        Carregando radar de demanda…
      </div>
    );
  }

  if (erro && !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {erro}
        <button
          type="button"
          onClick={() => void carregar()}
          className="ml-2 font-semibold underline"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-indigo-700" />
          <h3 className="font-semibold text-indigo-950">Radar de demanda do bairro</h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dias}
            onChange={(e) => setDias(Number(e.target.value) as (typeof PERIODOS)[number])}
            className="rounded-lg border border-indigo-200 bg-white px-2 py-1 text-xs text-indigo-950"
            aria-label="Período do radar"
          >
            {PERIODOS.map((p) => (
              <option key={p} value={p}>
                {p} dias
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void carregar()}
            disabled={loading}
            className="rounded-lg bg-white p-1.5 text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50"
            aria-label="Atualizar radar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs text-indigo-800/90">{data.explicacao}</p>
      <p className="text-[11px] text-indigo-600">
        {data.totalSinais} sinais · últimos {data.periodoDias} dias
      </p>

      {data.termosBusca.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
            Termos mais buscados
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {data.termosBusca.slice(0, 6).map((t) => (
              <span
                key={t.termo}
                className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-gray-800 ring-1 ring-indigo-100"
              >
                {t.termo} ({t.ocorrencias})
              </span>
            ))}
          </div>
        </div>
      )}

      {data.itens.length === 0 ? (
        <p className="mt-3 text-sm text-gray-600">
          Ainda poucos sinais — incentive clientes a usar listas e busca no app.
        </p>
      ) : (
        <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
          {data.itens.map((item) => (
            <li
              key={item.produtoId}
              className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{item.nome}</p>
                {item.categoria && (
                  <p className="text-[11px] text-gray-500">{item.categoria}</p>
                )}
                {item.buscasRecentes > 0 && (
                  <p className="text-[10px] text-indigo-600">
                    +{item.buscasRecentes} buscas relacionadas
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    item.pressao === 'ALTA'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {item.listasAtivas} listas
                </span>
                <Link
                  href={`/gestor/produtos?busca=${encodeURIComponent(item.nome.slice(0, 40))}`}
                  className="text-[10px] font-semibold text-indigo-700 hover:underline"
                >
                  Ver no catálogo
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
