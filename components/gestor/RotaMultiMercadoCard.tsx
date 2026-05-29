'use client';

import { useCallback, useEffect, useState } from 'react';
import { Route, Loader2, RefreshCw } from 'lucide-react';

interface Props {
  mercadoId?: string;
  compact?: boolean;
}

type Stats = {
  consolidacoesAceitas: number;
  consolidacoesDesfeitas: number;
  taxaAceitePct: number;
  deltaMedioAceito: number;
  mercadosEvitadosTotal: number;
  explicacao: string;
  periodoDias: number;
};

const PERIODOS = [7, 30, 90] as const;

export function RotaMultiMercadoCard({ mercadoId, compact = false }: Props) {
  const [dias, setDias] = useState<(typeof PERIODOS)[number]>(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    const q = new URLSearchParams({ dias: String(dias) });
    if (mercadoId) q.set('mercadoId', mercadoId);
    try {
      const res = await fetch(`/api/gestor/rota-multi-mercado?${q}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      } else {
        setErro(json.error ?? 'Erro ao carregar');
      }
    } catch {
      setErro('Erro de rede');
    } finally {
      setLoading(false);
    }
  }, [mercadoId, dias]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (loading && !stats) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando rota multi-mercado…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-sky-50 to-cyan-50">
        <div className="flex items-center gap-2">
          <Route className="h-5 w-5 text-sky-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Rota multi-mercado</h3>
            <p className="text-xs text-gray-600">Consolidações de lista no app</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {PERIODOS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setDias(p)}
              className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                dias === p ? 'bg-sky-600 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'
              }`}
            >
              {p}d
            </button>
          ))}
          <button
            type="button"
            onClick={() => void carregar()}
            className="p-1.5 rounded-lg hover:bg-white/80 text-gray-600 ml-1"
            title="Atualizar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {erro && <p className="text-sm text-red-700">{erro}</p>}

        {stats && stats.consolidacoesAceitas === 0 && stats.consolidacoesDesfeitas === 0 && !erro && (
          <p className="text-sm text-gray-600">
            Nenhuma consolidação registrada no período. Quando clientes aceitarem otimizar a lista multi-loja, os números aparecem aqui.
          </p>
        )}

        {stats && (stats.consolidacoesAceitas > 0 || stats.consolidacoesDesfeitas > 0) && (
          <>
            <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
              <div className="rounded-lg bg-sky-50 border border-sky-100 p-2">
                <p className="font-bold text-sky-700">{stats.consolidacoesAceitas}</p>
                <p className="text-sky-600">Aceitas</p>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
                <p className="font-bold text-gray-700">{stats.taxaAceitePct}%</p>
                <p className="text-gray-600">Taxa aceite</p>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2">
                <p className="font-bold text-emerald-700">{stats.mercadosEvitadosTotal}</p>
                <p className="text-emerald-600">Menos idas</p>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-100 p-2">
                <p className="font-bold text-amber-800">
                  {stats.deltaMedioAceito >= 0 ? '+' : ''}
                  R$ {stats.deltaMedioAceito.toFixed(2)}
                </p>
                <p className="text-amber-700">Delta médio</p>
              </div>
            </div>

            {!compact && (
              <p className="text-xs text-gray-500">{stats.explicacao}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
