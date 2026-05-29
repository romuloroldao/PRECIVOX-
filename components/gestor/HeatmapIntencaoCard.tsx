'use client';

import { useCallback, useEffect, useMemo, useState, Fragment } from 'react';
import { Clock, Loader2, RefreshCw } from 'lucide-react';

interface Props {
  mercadoId?: string;
  compact?: boolean;
}

type Celula = {
  diaSemana: number;
  diaLabel: string;
  faixaHora: number;
  faixaLabel: string;
  intensidade: number;
  eventosPonderados: number;
};

type Pico = {
  diaLabel: string;
  faixaLabel: string;
  intensidade: number;
};

type HeatmapData = {
  celulas: Celula[];
  picos: Pico[];
  totalEventos: number;
  usuariosUnicos: number;
  explicacao: string;
  periodoDias: number;
};

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const FAIXAS = [0, 4, 8, 12, 16, 20];
const FAIXA_LABELS: Record<number, string> = {
  0: '0–3h',
  4: '4–7h',
  8: '8–11h',
  12: '12–15h',
  16: '16–19h',
  20: '20–23h',
};

const PERIODOS = [7, 14, 30] as const;

function corIntensidade(v: number): string {
  if (v >= 75) return 'bg-violet-600';
  if (v >= 50) return 'bg-violet-500';
  if (v >= 30) return 'bg-violet-400';
  if (v >= 15) return 'bg-violet-300';
  if (v > 0) return 'bg-violet-200';
  return 'bg-gray-100';
}

export function HeatmapIntencaoCard({ mercadoId, compact = false }: Props) {
  const [dias, setDias] = useState<(typeof PERIODOS)[number]>(14);
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    const q = new URLSearchParams({ dias: String(dias) });
    if (mercadoId) q.set('mercadoId', mercadoId);
    try {
      const res = await fetch(`/api/gestor/heatmap-intencao?${q}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setErro(json.error ?? 'Erro ao carregar heatmap');
        setData(null);
      }
    } catch {
      setErro('Erro de rede');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [mercadoId, dias]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const grid = useMemo(() => {
    if (!data) return new Map<string, Celula>();
    const m = new Map<string, Celula>();
    for (const c of data.celulas) {
      m.set(`${c.diaSemana}-${c.faixaHora}`, c);
    }
    return m;
  }, [data]);

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Montando heatmap de intenção…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-violet-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Heatmap de intenção</h3>
            <p className="text-xs text-gray-600">
              Quando o bairro usa o app (agregado)
              {data && data.usuariosUnicos > 0 && (
                <span className="ml-1">· {data.usuariosUnicos} usuários</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {PERIODOS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setDias(p)}
              className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                dias === p ? 'bg-violet-600 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'
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

      <div className="p-4 space-y-4">
        {erro && <p className="text-sm text-red-700">{erro}</p>}

        {!erro && data && data.totalEventos === 0 && (
          <p className="text-sm text-gray-600">
            Sem eventos de intenção no período. Com uso do app (busca, lista, visualização), o mapa preenche.
          </p>
        )}

        {data && data.totalEventos > 0 && (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-[320px]">
                <div className="grid grid-cols-8 gap-0.5 text-xs">
                  <div />
                  {DIAS.map((d) => (
                    <div key={d} className="text-center font-medium text-gray-600 py-1">
                      {d}
                    </div>
                  ))}
                  {FAIXAS.map((faixa) => (
                    <Fragment key={faixa}>
                      <div className="text-right pr-1 text-gray-500 flex items-center justify-end">
                        {FAIXA_LABELS[faixa]}
                      </div>
                      {DIAS.map((_, diaIdx) => {
                        const c = grid.get(`${diaIdx}-${faixa}`);
                        const v = c?.intensidade ?? 0;
                        return (
                          <div
                            key={`${diaIdx}-${faixa}`}
                            title={`${DIAS[diaIdx]} ${FAIXA_LABELS[faixa]}: ${v}% (${c?.eventosPonderados ?? 0} pts)`}
                            className={`aspect-square rounded-sm ${corIntensidade(v)} transition-colors`}
                          />
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>

            {!compact && data.picos.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Horários de pico</p>
                <ul className="flex flex-wrap gap-2">
                  {data.picos.map((p, i) => (
                    <li
                      key={`${p.diaLabel}-${p.faixaLabel}-${i}`}
                      className="text-xs px-2 py-1 rounded-full bg-violet-100 text-violet-800 border border-violet-200"
                    >
                      {p.diaLabel} {p.faixaLabel} · {p.intensidade}%
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {compact && data.picos[0] && (
              <p className="text-xs text-gray-600">
                Pico: <strong>{data.picos[0].diaLabel} {data.picos[0].faixaLabel}</strong> ({data.picos[0].intensidade}%)
              </p>
            )}

            <p className="text-xs text-gray-500 border-t border-gray-100 pt-2">{data.explicacao}</p>
          </>
        )}
      </div>
    </div>
  );
}
