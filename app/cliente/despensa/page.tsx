'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { MercadoSelector } from '@/components/cliente/MercadoSelector';
import { ClientePage } from '@/components/cliente/ClientePage';
import { useLista, type ItemLista } from '@/app/context/ListaContext';
import { useToast } from '@/components/ToastContainer';
import { UX } from '@/lib/ux-copy';
import {
  copyDespensaPreditiva,
  deveSugerirIncluirNaCompra,
  labelStatusCurto,
} from '@/lib/despensa-copy';
import { isAiNativeShellEnabled } from '@/lib/ai-native-shell';
import { rememberMercadoId, getRememberedMercadoId } from '@/lib/cliente-mercado-ref';
import { Loader2, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type DespensaItem = {
  produtoId: string;
  nome: string;
  cicloDias: number;
  diasDesdeUltimaCompra: number | null;
  diasRestantes: number | null;
  status: 'ok' | 'atencao' | 'acabando';
  frequenciaLista: number;
  fonte: 'inferido' | 'manual';
};

const STATUS_COLOR: Record<DespensaItem['status'], string> = {
  acabando: 'bg-red-100 text-red-800',
  atencao: 'bg-amber-100 text-amber-900',
  ok: 'bg-emerald-100 text-emerald-800',
};

/**
 * Despensa da casa — ver/adicionar sem mercado.
 * Mercado só na hora de incluir item na compra (preço).
 */
export default function DespensaPage() {
  const router = useRouter();
  const { adicionarItem, itens: itensLista } = useLista();
  const { success, error: toastError } = useToast();
  const [itens, setItens] = useState<DespensaItem[]>([]);
  const [resumo, setResumo] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState('');
  const [novoCiclo, setNovoCiclo] = useState('14');
  const [salvando, setSalvando] = useState(false);
  const [intentScore, setIntentScore] = useState<number | null>(null);
  const [incluindoId, setIncluindoId] = useState<string | null>(null);
  /** Item aguardando escolha de mercado para ir à compra */
  const [pendenteIncluir, setPendenteIncluir] = useState<DespensaItem | null>(null);
  const [mercadoCompraId, setMercadoCompraId] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const [despRes, intentRes] = await Promise.all([
        fetch('/api/cliente/despensa', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/cliente/intent-score', { credentials: 'include', cache: 'no-store' }),
      ]);
      const json = await despRes.json();
      if (!despRes.ok || !json.success) throw new Error(json.error || 'Falha ao carregar');
      setItens(json.data.itens ?? []);
      setResumo(json.data.resumo ?? '');

      try {
        const intentJson = await intentRes.json();
        const score = intentJson?.data?.score ?? intentJson?.score;
        if (typeof score === 'number') setIntentScore(score);
      } catch {
        /* intent opcional */
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro');
      setItens([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    if (!pendenteIncluir) return;
    const remembered = getRememberedMercadoId();
    if (remembered) setMercadoCompraId(remembered);
  }, [pendenteIncluir]);

  const jaNaLista = useCallback(
    (produtoId: string) =>
      itensLista.some(
        (i) => i.produtoCatalogoId === produtoId || i.id === produtoId || i.estoqueId === `manual-${produtoId}`
      ),
    [itensLista]
  );

  const executarIncluirNaCompra = async (item: DespensaItem, mercadoId: string) => {
    if (!mercadoId || incluindoId) return;
    setIncluindoId(item.produtoId);
    setErro(null);
    try {
      rememberMercadoId(mercadoId);

      if (item.produtoId.startsWith('manual-')) {
        const stub: ItemLista = {
          id: item.produtoId,
          produtoCatalogoId: item.produtoId,
          estoqueId: `manual-${item.produtoId}`,
          nome: item.nome,
          preco: 0,
          emPromocao: false,
          quantidade: 1,
          unidade: {
            id: 'manual',
            nome: 'A definir',
            mercado: { id: mercadoId, nome: 'Mercado' },
          },
        };
        adicionarItem(stub);
        success(UX.despensa.incluido);
        setPendenteIncluir(null);
        return;
      }

      const res = await fetch('/api/cliente/despensa/para-lista', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mercadoId, produtoIds: [item.produtoId] }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || UX.despensa.semEstoque);
      }
      const resolved = (json.data?.itens ?? []) as ItemLista[];
      if (resolved.length === 0) {
        toastError(UX.despensa.semEstoque);
        router.push(`/cliente/busca?q=${encodeURIComponent(item.nome)}`);
        setPendenteIncluir(null);
        return;
      }
      for (const row of resolved) {
        adicionarItem(row);
      }
      success(UX.despensa.incluido);
      setPendenteIncluir(null);
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Erro ao incluir');
    } finally {
      setIncluindoId(null);
    }
  };

  const pedirIncluir = (item: DespensaItem) => {
    const remembered = getRememberedMercadoId();
    if (remembered) {
      void executarIncluirNaCompra(item, remembered);
      return;
    }
    setMercadoCompraId('');
    setPendenteIncluir(item);
  };

  const adicionarManual = async () => {
    if (!novoNome.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      const pid = `manual-${Date.now()}`;
      const res = await fetch('/api/cliente/despensa', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'adicionar',
          entrada: {
            produtoId: pid,
            nome: novoNome.trim(),
            cicloDias: parseInt(novoCiclo, 10) || 14,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Falha ao salvar');
      setNovoNome('');
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const removerManual = async (produtoId: string) => {
    setSalvando(true);
    try {
      await fetch('/api/cliente/despensa', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'remover', produtoId }),
      });
      await carregar();
    } finally {
      setSalvando(false);
    }
  };

  const compraHref = isAiNativeShellEnabled() ? '/cliente/compra' : '/cliente/busca';

  return (
    <DashboardLayout role="CLIENTE">
      <ClientePage title={UX.despensa.titulo} description={UX.despensa.subtitulo}>
        <div className="mx-auto max-w-lg space-y-5">
          {resumo && !loading && (
            <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">{resumo}</p>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
          ) : (
            <ul className="space-y-2">
              {itens.map((item) => {
                const copy = copyDespensaPreditiva({
                  ...item,
                  intentScore,
                });
                const showCta = deveSugerirIncluirNaCompra(copy.urgencia);
                const naLista = jaNaLista(item.produtoId);
                const busy = incluindoId === item.produtoId;

                return (
                  <li
                    key={item.produtoId}
                    className={cn(
                      'rounded-xl border bg-white p-3 shadow-sm',
                      copy.urgencia === 'alta'
                        ? 'border-red-200'
                        : copy.urgencia === 'media'
                          ? 'border-amber-200'
                          : 'border-slate-200'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">{item.nome}</p>
                        <p className="mt-0.5 text-sm font-medium text-slate-800">{copy.primaria}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {copy.secundaria}
                          {item.fonte === 'manual' ? ' · manual' : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                            STATUS_COLOR[item.status]
                          )}
                        >
                          {labelStatusCurto(item.status)}
                        </span>
                        {item.fonte === 'manual' && (
                          <button
                            type="button"
                            disabled={salvando}
                            onClick={() => void removerManual(item.produtoId)}
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {showCta && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {naLista ? (
                          <Link
                            href={compraHref}
                            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
                          >
                            <ShoppingCart className="h-4 w-4" aria-hidden />
                            {UX.despensa.verCompra}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => pedirIncluir(item)}
                            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                          >
                            {busy ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                              <ShoppingCart className="h-4 w-4" aria-hidden />
                            )}
                            {busy ? UX.despensa.incluindo : UX.despensa.incluir}
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
              {itens.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">{UX.despensa.vazio}</p>
              )}
            </ul>
          )}

          {pendenteIncluir && (
            <div
              role="dialog"
              aria-labelledby="despensa-mercado-titulo"
              className="rounded-xl border border-primary-200 bg-white p-4 shadow-md"
            >
              <p id="despensa-mercado-titulo" className="font-semibold text-slate-900">
                {UX.despensa.escolherMercadoParaCompra}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {pendenteIncluir.nome} — {UX.despensa.escolherMercadoDica}
              </p>
              <div className="mt-3">
                <MercadoSelector
                  mode="required"
                  value={mercadoCompraId}
                  onChange={setMercadoCompraId}
                />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPendenteIncluir(null)}
                  className="min-h-[44px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {UX.despensa.cancelar}
                </button>
                <button
                  type="button"
                  disabled={!mercadoCompraId || incluindoId === pendenteIncluir.produtoId}
                  onClick={() => void executarIncluirNaCompra(pendenteIncluir, mercadoCompraId)}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {incluindoId === pendenteIncluir.produtoId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  {UX.despensa.incluir}
                </button>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              {UX.despensa.adicionarManual}
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label className="sr-only" htmlFor="despensa-nome">
                  Nome do produto
                </label>
                <input
                  id="despensa-nome"
                  type="text"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex.: Leite integral"
                  disabled={salvando}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-[10px] font-semibold uppercase text-slate-500"
                  htmlFor="despensa-ciclo"
                >
                  {UX.despensa.cicloDias}
                </label>
                <input
                  id="despensa-ciclo"
                  type="number"
                  min={3}
                  max={60}
                  value={novoCiclo}
                  onChange={(e) => setNovoCiclo(e.target.value)}
                  disabled={salvando}
                  className="w-20 rounded-lg border border-slate-300 px-2 py-2 text-sm"
                  title={UX.despensa.cicloDias}
                />
              </div>
              <button
                type="button"
                disabled={salvando || !novoNome.trim()}
                onClick={() => void adicionarManual()}
                className="inline-flex min-h-[44px] items-center justify-center gap-1 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </button>
            </div>
          </div>

          {erro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {erro}
            </p>
          )}
        </div>
      </ClientePage>
    </DashboardLayout>
  );
}
