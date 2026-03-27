'use client';

import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Calendar, Sparkles } from 'lucide-react';

type AcaoSemanal = {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: 'alta' | 'media' | 'baixa';
  categoria: 'demanda' | 'lista' | 'nps' | 'estoque' | 'geral';
  linkHref?: string;
};

type RegiaoPrecoApi = {
  pedido: 'cidade' | 'ampla' | 'proximidade';
  efetivo: 'cidade' | 'ampla' | 'proximidade';
  fallbackDeCidadeParaAmpla: boolean;
  raioKm?: number;
};

type ResumoPayload = {
  acoes: AcaoSemanal[];
  narrativa: string;
  periodoDias: number;
  geradoEm: string;
  mercadoNome: string | null;
  regiaoPreco?: RegiaoPrecoApi;
};

const PRIORIDADE_STYLE = {
  alta: 'border-red-200 bg-red-50/80 text-red-900',
  media: 'border-amber-200 bg-amber-50/80 text-amber-900',
  baixa: 'border-slate-200 bg-slate-50 text-slate-800',
} as const;

const CATEGORIA_LABEL: Record<AcaoSemanal['categoria'], string> = {
  demanda: 'Demanda / catálogo',
  lista: 'Lista no app',
  nps: 'Satisfação (NPS)',
  estoque: 'Estoque',
  geral: 'Destaque',
};

export default function ResumoSemanaPage() {
  const { data: session, status } = useSession();
  const [mercadoId, setMercadoId] = useState('');
  const [mercadoResolvido, setMercadoResolvido] = useState(false);
  const [dias, setDias] = useState(30);
  const [regiaoPreco, setRegiaoPreco] = useState<'cidade' | 'ampla' | 'proximidade'>('cidade');
  const [raioKm, setRaioKm] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<ResumoPayload | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') setLoading(false);
    if (status !== 'authenticated') return;
    const sid = (session?.user as { mercadoId?: string })?.mercadoId;
    if (sid) {
      setMercadoId(sid);
      setMercadoResolvido(true);
      return;
    }
    if ((session?.user as { role?: string })?.role !== 'GESTOR') {
      setMercadoResolvido(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/markets', { cache: 'no-store' });
        const json = await res.json();
        const id = json.data?.[0]?.id as string | undefined;
        if (!cancelled) {
          setMercadoId(id || '');
          setMercadoResolvido(true);
        }
      } catch {
        if (!cancelled) {
          setMercadoId('');
          setMercadoResolvido(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, status]);

  const load = useCallback(async () => {
    if (!mercadoId) return;
    try {
      setLoading(true);
      setError(null);
      const q = new URLSearchParams({
        dias: String(dias),
        regiaoPreco,
        raioKm: String(raioKm),
      });
      const res = await fetch(`/api/gestor/ia/resumo-semana/${mercadoId}?${q}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar');
      setPayload({
        acoes: json.acoes,
        narrativa: json.narrativa,
        periodoDias: json.periodoDias,
        geradoEm: json.geradoEm,
        mercadoNome: json.mercadoNome ?? null,
        regiaoPreco: json.regiaoPreco,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }, [mercadoId, dias, regiaoPreco, raioKm]);

  useEffect(() => {
    if (status !== 'authenticated' || !mercadoResolvido) return;
    if (!mercadoId) {
      setError('Mercado não encontrado.');
      setLoading(false);
      return;
    }
    load();
  }, [status, mercadoId, mercadoResolvido, load]);

  return (
    <DashboardLayout role="GESTOR">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 md:px-6">
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 p-8 text-white shadow-lg">
          <Link
            href="/gestor/ia"
            className="mb-3 inline-flex items-center gap-1 text-sm opacity-90 hover:opacity-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Painel IA
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 flex items-center gap-2 text-sm font-medium opacity-90">
                <Sparkles className="h-4 w-4" />
                Prioridades para o dono de mercadinho
              </p>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Resumo inteligente</h1>
              <p className="mt-2 max-w-xl text-sm opacity-95">
                Prioriza demanda nas buscas, comportamento na lista, NPS (com temas), estoque e referência de
                preço na sua região — sem expor dados de outros mercados e sem depender de venda no app.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
              <label className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm backdrop-blur">
                <Calendar className="h-4 w-4" />
                <span className="sr-only">Período</span>
                <select
                  value={dias}
                  onChange={(e) => setDias(Number(e.target.value))}
                  className="rounded border-0 bg-white/20 text-white outline-none ring-0"
                >
                  <option value={7} className="text-gray-900">
                    7 dias
                  </option>
                  <option value={30} className="text-gray-900">
                    30 dias
                  </option>
                  <option value={60} className="text-gray-900">
                    60 dias
                  </option>
                  <option value={90} className="text-gray-900">
                    90 dias
                  </option>
                </select>
              </label>
              <label className="flex flex-wrap items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm backdrop-blur">
                <span className="sr-only">Referência de preço</span>
                <select
                  value={regiaoPreco}
                  onChange={(e) =>
                    setRegiaoPreco(e.target.value as 'cidade' | 'ampla' | 'proximidade')
                  }
                  className="max-w-[min(100vw-2rem,280px)] rounded border-0 bg-white/20 text-white outline-none ring-0"
                  title="Referência de preço na sua região"
                >
                  <option value="cidade" className="text-gray-900">
                    Preço: entorno (cidade)
                  </option>
                  <option value="ampla" className="text-gray-900">
                    Preço: região ampliada
                  </option>
                  <option value="proximidade" className="text-gray-900">
                    Preço: proximidade (km)
                  </option>
                </select>
                {regiaoPreco === 'proximidade' && (
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={raioKm}
                    onChange={(e) => setRaioKm(Number(e.target.value) || 25)}
                    className="w-16 rounded border-0 bg-white/30 px-1 py-0.5 text-white placeholder-white/70"
                    aria-label="Raio em km"
                  />
                )}
              </label>
            </div>
          </div>
          {payload?.mercadoNome && (
            <p className="mt-4 text-sm opacity-90">Mercado: {payload.mercadoNome}</p>
          )}
          {payload?.regiaoPreco?.fallbackDeCidadeParaAmpla && (
            <p className="mt-2 text-xs opacity-90">
              Referência de preço: cidade não informada no cadastro da unidade — usando visão ampliada.
            </p>
          )}
        </div>

        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
            Montando seu resumo…
          </div>
        )}
        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
        )}

        {!loading && !error && payload && (
          <>
            <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-emerald-950">Em uma frase</h2>
              <p className="mt-2 text-sm leading-relaxed text-emerald-900 md:text-base">{payload.narrativa}</p>
            </section>

            <section>
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Ações sugeridas ({payload.periodoDias} dias)
              </h2>
              {payload.acoes.length === 0 ? (
                <p className="text-sm text-gray-600">
                  Sem ações automáticas ainda. Use o app com clientes reais e volte em alguns dias.
                </p>
              ) : (
                <ul className="space-y-3">
                  {payload.acoes.map((acao) => (
                    <li
                      key={acao.id}
                      className={`rounded-xl border-2 p-4 transition ${PRIORIDADE_STYLE[acao.prioridade]}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
                            {CATEGORIA_LABEL[acao.categoria]} ·{' '}
                            {acao.prioridade === 'alta'
                              ? 'Prioridade alta'
                              : acao.prioridade === 'media'
                                ? 'Média'
                                : 'Baixa'}
                          </span>
                          <h3 className="mt-1 text-base font-bold">{acao.titulo}</h3>
                          <p className="mt-1 text-sm opacity-90">{acao.descricao}</p>
                        </div>
                        {acao.linkHref && (
                          <Link
                            href={acao.linkHref}
                            className="shrink-0 rounded-lg bg-white/80 px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-white"
                          >
                            Abrir
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <p className="text-center text-xs text-gray-500">
              Gerado em {new Date(payload.geradoEm).toLocaleString('pt-BR')} ·{' '}
              <Link href="/gestor/ia/conversao" className="text-emerald-700 underline hover:no-underline">
                Ver detalhes em Conversão
              </Link>
            </p>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
