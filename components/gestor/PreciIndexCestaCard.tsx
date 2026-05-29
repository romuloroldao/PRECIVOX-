'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, Loader2, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';

interface Props {
  mercadoId?: string;
  compact?: boolean;
}

type Item = {
  slug: string;
  label: string;
  precoRegional: number | null;
  precoMercado: number | null;
  diferencaPct: number | null;
};

type Data = {
  indiceValor: number | null;
  variacaoPct: number | null;
  valorCestaRegional: number;
  valorCestaMercado: number | null;
  posicaoMercadoPct: number | null;
  itens: Item[];
  cobertura: { encontrados: number; total: number; pct: number };
  explicacao: string;
  regiao: { label: string };
};

const REGIOES = [
  { id: 'cidade', label: 'Cidade' },
  { id: 'ampla', label: 'UF' },
  { id: 'proximidade', label: 'Raio' },
] as const;

export function PreciIndexCestaCard({ mercadoId, compact = false }: Props) {
  const [data, setData] = useState<Data | null>(null);
  const [regiaoPreco, setRegiaoPreco] = useState<(typeof REGIOES)[number]['id']>('cidade');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    const q = new URLSearchParams({ regiaoPreco, raioKm: '25' });
    if (mercadoId) q.set('mercadoId', mercadoId);
    try {
      const res = await fetch(`/api/gestor/preci-index?${q}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setErro(json.error ?? 'Erro ao carregar PRECI Index');
      }
    } catch {
      setErro('Erro de rede');
    } finally {
      setLoading(false);
    }
  }, [mercadoId, regiaoPreco]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Calculando PRECI Index do bairro…
      </div>
    );
  }

  const itensVisiveis = compact
    ? (data?.itens ?? []).filter((i) => i.precoMercado != null).slice(0, 4)
    : (data?.itens ?? []).filter((i) => i.precoRegional != null);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-violet-600" />
          <div>
            <h3 className="font-semibold text-gray-900">PRECI Index — cesta bairro</h3>
            <p className="text-xs text-gray-600">
              Índice hiperlocal de 10 itens essenciais · {data?.regiao.label ?? 'região'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {REGIOES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRegiaoPreco(r.id)}
              className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                regiaoPreco === r.id
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/80 text-gray-600 hover:bg-white'
              }`}
            >
              {r.label}
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

        {data && data.cobertura.encontrados > 0 && (
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-violet-50 border border-violet-100 p-2">
              <p className="font-bold text-violet-800 text-lg">
                {data.indiceValor != null ? data.indiceValor.toFixed(1) : '—'}
              </p>
              <p className="text-violet-600">Índice (base 100)</p>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
              <p className="font-bold text-gray-800">
                R$ {data.valorCestaRegional.toFixed(2)}
              </p>
              <p className="text-gray-600">Cesta bairro</p>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
              <p className="font-bold text-gray-800 flex items-center justify-center gap-0.5">
                {data.posicaoMercadoPct != null && data.posicaoMercadoPct > 2 && (
                  <TrendingUp className="h-3 w-3 text-red-500" />
                )}
                {data.posicaoMercadoPct != null && data.posicaoMercadoPct < -2 && (
                  <TrendingDown className="h-3 w-3 text-emerald-500" />
                )}
                {data.posicaoMercadoPct != null
                  ? `${data.posicaoMercadoPct > 0 ? '+' : ''}${data.posicaoMercadoPct}%`
                  : '—'}
              </p>
              <p className="text-gray-600">Sua loja vs bairro</p>
            </div>
          </div>
        )}

        {data && data.cobertura.encontrados === 0 && !erro && (
          <p className="text-sm text-gray-600">
            Sem dados suficientes para montar a cesta-referência nesta região.
          </p>
        )}

        {itensVisiveis.map((item) => (
          <div
            key={item.slug}
            className="flex items-center justify-between gap-2 text-sm border-b border-gray-50 pb-2 last:border-0"
          >
            <span className="text-gray-800 font-medium">{item.label}</span>
            <div className="text-right text-xs text-gray-600 shrink-0">
              {item.precoRegional != null && (
                <span>Bairro R$ {item.precoRegional.toFixed(2)}</span>
              )}
              {item.precoMercado != null && (
                <span className="ml-2">
                  · Seu R$ {item.precoMercado.toFixed(2)}
                  {item.diferencaPct != null && (
                    <span
                      className={
                        item.diferencaPct > 3
                          ? ' text-red-600'
                          : item.diferencaPct < -3
                            ? ' text-emerald-600'
                            : ''
                      }
                    >
                      {' '}
                      ({item.diferencaPct > 0 ? '+' : ''}
                      {item.diferencaPct}%)
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        ))}

        {data?.explicacao && data.cobertura.encontrados > 0 && (
          <p className="text-xs text-gray-500 border-t border-gray-100 pt-3">
            {data.explicacao}
            {data.variacaoPct != null && (
              <> Variação estimada: {data.variacaoPct > 0 ? '+' : ''}{data.variacaoPct}% (30d).</>
            )}
            {' '}
            Cobertura: {data.cobertura.encontrados}/{data.cobertura.total} itens.
          </p>
        )}
      </div>
    </div>
  );
}
