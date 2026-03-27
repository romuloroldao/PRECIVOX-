'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

type Tendencia = { termo: string; buscas: number; demanda: 'ALTA' | 'MEDIA' };

type ItemAbandonado = {
  produtoId: string;
  nome: string;
  adicoes: number;
  remocoes: number;
  taxaDesistenciaLista: number;
  precoAtual?: number;
  precoMedioRegional?: number;
  diferencaPct?: number;
  recomendacao: string;
  /** Agrupamento lógico (EAN ou nome+marca+categoria normalizados) */
  chaveInsight?: string;
};

type TemaContagem = { id: string; label: string; count: number };

type NpsData = {
  score: number | null;
  promotores: number;
  neutros: number;
  detratores: number;
  total: number;
  zonaLabel: string;
  comentariosRecentes: string[];
  temasElogios: TemaContagem[];
  temasCriticas: TemaContagem[];
};

type ResumoSemanalPayload = {
  acoes: Array<{
    id: string;
    titulo: string;
    descricao: string;
    prioridade: 'alta' | 'media' | 'baixa';
    categoria: string;
    linkHref?: string;
  }>;
  narrativa: string;
  periodoDias: number;
};

type Resumo = {
  adicoesLista: number;
  remocoesLista: number;
  buscasLista: number;
  linhasVendaImportadas: number;
  ticketMedioImportado: number | null;
};

type RegiaoPrecoApi = {
  pedido: 'cidade' | 'ampla' | 'proximidade';
  efetivo: 'cidade' | 'ampla' | 'proximidade';
  fallbackDeCidadeParaAmpla: boolean;
  raioKm?: number;
};

type ApiPayload = {
  tendenciasBusca: Tendencia[];
  insightTendencias: string;
  itensAbandonados: ItemAbandonado[];
  nps: NpsData;
  resumo: Resumo;
  resumoSemanal?: ResumoSemanalPayload;
  periodo: { dias: number };
  regiaoPreco?: RegiaoPrecoApi;
};

/** Texto curto sobre qual “sua região” está sendo usada na referência de preço. */
function detalheRegiaoPreco(r?: RegiaoPrecoApi): string {
  if (!r) return 'média agregada na sua região (por categoria)';
  if (r.fallbackDeCidadeParaAmpla) {
    return 'média com visão ampliada (cadastre a cidade da unidade para aproximar do entorno físico)';
  }
  if (r.efetivo === 'proximidade') {
    const km = r.raioKm ?? 25;
    return `média em raio de ~${km} km a partir do endereço geocodificado da unidade (produto lógico quando houver chave)`;
  }
  if (r.efetivo === 'cidade') {
    return 'média no entorno imediato — mesma cidade do cadastro da unidade (produto lógico quando houver chave)';
  }
  return 'média com visão ampliada na sua região — mais pontos agregados (produto lógico quando houver chave)';
}

export default function ModuloConversaoPage() {
  const { data: session, status } = useSession();
  const [mercadoId, setMercadoId] = useState('');
  const [mercadoResolvido, setMercadoResolvido] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiPayload | null>(null);
  /** Granularidade da referência de preço (comportamento de quem pode ir à loja física). */
  const [regiaoPreco, setRegiaoPreco] = useState<'cidade' | 'ampla' | 'proximidade'>('cidade');
  const [raioKm, setRaioKm] = useState(25);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setLoading(false);
    }
    if (status !== 'authenticated') {
      return;
    }
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
        dias: '30',
        regiaoPreco,
        raioKm: String(raioKm),
      });
      const res = await fetch(`/api/gestor/ia/conversao/${mercadoId}?${q}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Erro ao carregar');
      }
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [mercadoId, regiaoPreco, raioKm]);

  useEffect(() => {
    if (status !== 'authenticated' || !mercadoResolvido) {
      return;
    }
    if (!mercadoId) {
      setError('Mercado não encontrado. Cadastre um mercado ou associe o gestor.');
      setLoading(false);
      return;
    }
    load();
  }, [status, mercadoId, mercadoResolvido, load]);

  const tendencias = data?.tendenciasBusca ?? [];
  const abandonados = data?.itensAbandonados ?? [];
  const nps = data?.nps;
  const resumo = data?.resumo;

  return (
    <DashboardLayout role="GESTOR">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-8 text-white">
          <Link href="/gestor/ia" className="text-sm opacity-75 hover:opacity-100 mb-2 inline-block">
            ← Voltar ao Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">🛍️ Conversão e Fidelização</h1>
          <p className="text-lg opacity-90">
            Tendências de comportamento no app, demanda nas buscas, lista e satisfação — com referência de
            preço na sua região (agregada, sem identificar outros mercados).
          </p>
          {data?.periodo && (
            <p className="text-sm opacity-80 mt-2">Período: últimos {data.periodo.dias} dias</p>
          )}
        </div>

        {mercadoId && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Referência de preço na sua região
            </label>
            <p className="text-xs text-gray-600 mb-2">
              Coordenadas da unidade são obtidas automaticamente a partir do endereço (geocodificação ao
              cadastrar). O modo &quot;proximidade&quot; usa raio em km; os demais usam cidade ou visão
              ampliada.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <select
                value={regiaoPreco}
                onChange={(e) =>
                  setRegiaoPreco(e.target.value as 'cidade' | 'ampla' | 'proximidade')
                }
                className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              >
                <option value="cidade">Entorno imediato (mesma cidade do cadastro da unidade)</option>
                <option value="ampla">Região ampliada (mais pontos na média)</option>
                <option value="proximidade">Proximidade (raio em km a partir do endereço)</option>
              </select>
              {regiaoPreco === 'proximidade' && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  Raio (km)
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={raioKm}
                    onChange={(e) => setRaioKm(Number(e.target.value) || 25)}
                    className="w-24 rounded border border-gray-300 px-2 py-1"
                  />
                </label>
              )}
            </div>
            {data?.regiaoPreco?.fallbackDeCidadeParaAmpla && (
              <p className="mt-2 text-xs text-amber-800">
                Sem cidade no cadastro da unidade: usamos a referência ampliada neste cálculo.
              </p>
            )}
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-xl shadow p-6 text-gray-600">Carregando métricas…</div>
        )}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">{error}</div>
        )}

        {!loading && !error && (
          <>
            {data?.resumoSemanal && data.resumoSemanal.acoes.length > 0 && (
              <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-md">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-emerald-950">Resumo da semana (comportamento e operação)</h2>
                    <p className="mt-2 text-sm leading-relaxed text-emerald-900">
                      {data.resumoSemanal.narrativa}
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-emerald-950">
                      {data.resumoSemanal.acoes.slice(0, 3).map((a) => (
                        <li key={a.id} className="flex gap-2">
                          <span className="font-bold text-emerald-600">•</span>
                          <span>
                            <span className="font-semibold">{a.titulo}</span>
                            {' — '}
                            {a.descricao}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    href="/gestor/ia/resumo"
                    className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Ver resumo completo
                  </Link>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">📈 Engajamento e intenção (app)</h2>
              <p className="text-sm text-gray-600 mb-4">
                O Precivox não processa pagamento nem caixa: estes números refletem como as pessoas usam o app
                (lista, busca, remoções). Vendas importadas, se existirem, aparecem à parte — não são
                necessárias para estes cartões.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="border-2 border-blue-200 rounded-lg p-5">
                  <h3 className="font-semibold text-gray-700 mb-2">Adições à lista</h3>
                  <p className="text-3xl font-bold text-blue-600">{resumo?.adicoesLista ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-2">Itens adicionados à lista inteligente no período.</p>
                </div>

                <div className="border-2 border-orange-200 rounded-lg p-5">
                  <h3 className="font-semibold text-gray-700 mb-2">Remoções da lista</h3>
                  <p className="text-3xl font-bold text-gray-900">{resumo?.remocoesLista ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-2">Itens retirados da lista (proxy de desistência na jornada).</p>
                </div>

                <div className="border-2 border-indigo-200 rounded-lg p-5">
                  <h3 className="font-semibold text-gray-700 mb-2">Buscas (eventos)</h3>
                  <p className="text-3xl font-bold text-indigo-600">{resumo?.buscasLista ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-2">Buscas registradas no app no período.</p>
                </div>

                <div className="border-2 border-green-200 rounded-lg p-5 lg:col-span-2">
                  <h3 className="font-semibold text-gray-700 mb-2">Vendas no banco (opcional)</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {resumo?.linhasVendaImportadas ?? 0}
                    {resumo?.ticketMedioImportado != null && (
                      <span className="text-base font-normal text-gray-600">
                        {' '}
                        · ticket médio R$ {resumo.ticketMedioImportado.toFixed(2)}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Só quando houver importação/integração de vendas nas unidades. Pode ficar zero no modelo atual
                    (upload manual de catálogo apenas).
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                📋 Itens com mais desistência na lista (app)
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                <strong>Taxa de desistência</strong> = remoções ÷ adições no período (comportamento na lista:
                colocou e tirou). Não mede compra no caixa — isso exigiria integração ou importação de vendas.
              </p>

              {abandonados.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Sem dados suficientes (mínimo de adições por produto). Quando houver uso da lista e remoções,
                  os itens com maior taxa de desistência aparecem aqui.
                </p>
              ) : (
                <div className="space-y-4">
                  {abandonados.map((item) => (
                    <div
                      key={item.produtoId}
                      className="border border-gray-200 rounded-lg p-5 hover:border-purple-400 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <h3 className="font-bold text-gray-900 text-lg">{item.nome}</h3>
                        <span className="shrink-0 px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                          {item.taxaDesistenciaLista}% desistência
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-gray-50 rounded p-3 text-center">
                          <p className="text-xs text-gray-500">Adições</p>
                          <p className="font-bold text-gray-900">{item.adicoes}</p>
                        </div>
                        <div className="bg-gray-50 rounded p-3 text-center">
                          <p className="text-xs text-gray-500">Remoções</p>
                          <p className="font-bold text-gray-900">{item.remocoes}</p>
                        </div>
                        <div className="bg-gray-50 rounded p-3 text-center">
                          <p className="text-xs text-gray-500">Desistência</p>
                          <p className="font-bold text-red-600">{item.taxaDesistenciaLista}%</p>
                        </div>
                      </div>

                      {item.precoAtual != null && item.precoMedioRegional != null && (
                        <div
                          className={`rounded border p-3 mb-3 ${
                            item.diferencaPct != null && item.diferencaPct > 5
                              ? 'bg-amber-50 border-amber-300'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <p className="text-sm text-gray-900">
                            <span className="font-semibold">Referência de preço na sua região:</span> para a
                            mesma categoria, {detalheRegiaoPreco(data?.regiaoPreco)} — valor de referência{' '}
                            <strong>R$ {item.precoMedioRegional.toFixed(2)}</strong> (dados anônimos, sem
                            identificar outros estabelecimentos). Seu preço no catálogo:{' '}
                            <strong>R$ {item.precoAtual.toFixed(2)}</strong>.
                            {item.diferencaPct != null && item.diferencaPct > 5 && (
                              <>
                                {' '}
                                Está cerca de <strong>{item.diferencaPct}%</strong> acima dessa referência —
                                pode influenciar quem monta a lista no app.
                              </>
                            )}
                            {item.diferencaPct != null && item.diferencaPct < -5 && (
                              <>
                                {' '}
                                Está abaixo da referência regional — bom para percepção de preço na lista.
                              </>
                            )}
                          </p>
                        </div>
                      )}

                      <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
                        <p className="text-sm font-semibold text-purple-900 mb-1">💡 Recomendação:</p>
                        <p className="text-sm text-purple-800">{item.recomendacao}</p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.precoAtual != null && item.diferencaPct != null && item.diferencaPct > 5 && (
                          <Link
                            href={`/gestor/produtos/${item.produtoId}`}
                            className="flex-1 min-w-[140px] text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Ajustar preço / produto
                          </Link>
                        )}
                        <Link
                          href={`/gestor/produtos/${item.produtoId}`}
                          className="flex-1 min-w-[140px] text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Ver análise completa
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">⭐ NPS e Satisfação do Cliente</h2>
              <p className="text-sm text-gray-600 mb-6">
                NPS calculado a partir de respostas reais (0–10). Os clientes podem enviar pelo widget na área
                logada (após interações com o mercado).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-center mb-4">
                    <p className="text-6xl font-bold text-green-600 mb-2">
                      {nps?.score != null ? nps.score : '—'}
                    </p>
                    <p className="text-sm text-gray-600">✅ {nps?.zonaLabel ?? ''}</p>
                    <p className="text-xs text-gray-500 mt-1">{nps?.total ?? 0} respostas no período</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Promotores (9-10)</span>
                        <span className="font-bold text-green-600">{nps?.promotores ?? 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full"
                          style={{ width: `${Math.min(100, nps?.promotores ?? 0)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Neutros (7-8)</span>
                        <span className="font-bold text-yellow-600">{nps?.neutros ?? 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-yellow-500 h-3 rounded-full"
                          style={{ width: `${Math.min(100, nps?.neutros ?? 0)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Detratores (0-6)</span>
                        <span className="font-bold text-red-600">{nps?.detratores ?? 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-red-500 h-3 rounded-full"
                          style={{ width: `${Math.min(100, nps?.detratores ?? 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Temas nos comentários</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Classificação automática por palavras-chave (PT-BR) em notas 9–10 (elogios) e 0–6 (críticas).
                  </p>
                  <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-green-800 mb-2">Elogios (9–10)</p>
                      {nps?.temasElogios && nps.temasElogios.length > 0 ? (
                        <ul className="space-y-1.5">
                          {nps.temasElogios.slice(0, 6).map((t) => (
                            <li key={t.id} className="flex justify-between text-sm text-green-900">
                              <span>{t.label}</span>
                              <span className="font-bold text-green-700">{t.count}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">Sem menções classificadas ainda.</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-800 mb-2">Críticas (0–6)</p>
                      {nps?.temasCriticas && nps.temasCriticas.length > 0 ? (
                        <ul className="space-y-1.5">
                          {nps.temasCriticas.slice(0, 6).map((t) => (
                            <li key={t.id} className="flex justify-between text-sm text-red-900">
                              <span>{t.label}</span>
                              <span className="font-bold text-red-700">{t.count}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">Sem menções classificadas ainda.</p>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 mb-2">Comentários recentes</h3>
                  {nps?.comentariosRecentes && nps.comentariosRecentes.length > 0 ? (
                    <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
                      {nps.comentariosRecentes.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">Nenhum comentário textual no período.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🔍 Demanda aparente nas buscas (sem resultado no seu catálogo)
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Mostra o que os clientes procuraram e não encontraram no <em>seu</em> mercado — sinal de
                intenção, não de outras lojas. Frequência em equivalente mensal (estimativa).
              </p>

              {tendencias.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Nenhuma tendência no período. Buscas sem resultado são registradas quando um cliente logado
                  pesquisa e o seu mercado não tem oferta para o termo.
                </p>
              ) : (
                <div className="space-y-3">
                  {tendencias.map((tendencia) => (
                    <div
                      key={tendencia.termo}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-200 rounded-lg hover:border-purple-400 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 break-words">{tendencia.termo}</p>
                        <p className="text-sm text-gray-600">~{tendencia.buscas} buscas/mês (estimado)</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            tendencia.demanda === 'ALTA'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          🔥 {tendencia.demanda === 'ALTA' ? 'ALTA' : 'MÉDIA'} DEMANDA
                        </span>
                        <Link
                          href={`/gestor/produtos?sugestaoNome=${encodeURIComponent(tendencia.termo)}`}
                          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors text-center"
                        >
                          Adicionar ao mix
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 bg-purple-50 border border-purple-200 rounded p-4">
                <p className="text-sm text-purple-900">
                  <span className="font-semibold">💡 Insight:</span>{' '}
                  {data?.insightTendencias ||
                    'Cadastre ou renomeie itens para bater com o que as pessoas digitam — reduz fricção na busca.'}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
