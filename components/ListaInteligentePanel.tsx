'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useLista, type ItemLista } from '@/app/context/ListaContext';
import { recordRemocaoListaConfirmada, recordRotaConsolidacaoLista } from '@/lib/events/frontend-events';
import type { PropostaRotaOtimizacao } from '@/lib/lista-rota-proposta';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  ListOrdered,
  ChevronLeft,
  Info,
  MapPin,
  X,
  Lightbulb,
  Route,
  Undo2,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ToastContainer';
import { computeShoppingRoute, dicaDeslocamento } from '@/lib/lista-rota-ia';

export type ListaInteligenteVariant = 'drawer' | 'inline';

interface ListaInteligentePanelProps {
  variant: ListaInteligenteVariant;
  onClose: () => void;
  /** Quando true, não renderiza o header verde (uso com Drawer que já traz o título). */
  omitHeader?: boolean;
}

export function ListaInteligenteHeaderBlock({
  onClose,
  showCloseButton,
}: {
  onClose: () => void;
  showCloseButton: boolean;
}) {
  const { total, totalItens } = useLista();

  return (
    <div className="relative flex shrink-0 items-start justify-between gap-2 border-0 bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 text-white shadow-md">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2)]">
          <ShoppingCart className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-100/90">
            Busca · lista ativa
          </p>
          <h2 className="truncate text-lg font-bold leading-tight text-white">Lista inteligente</h2>
          <p className="mt-1 text-sm text-emerald-50">
            {totalItens > 0 ? (
              <>
                <span className="font-semibold">{totalItens}</span>{' '}
                {totalItens === 1 ? 'item' : 'itens'} ·{' '}
                <span className="font-bold tabular-nums">R$ {total.toFixed(2).replace('.', ',')}</span>
              </>
            ) : (
              'Nenhum item ainda'
            )}
          </p>
        </div>
      </div>
      {showCloseButton && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-2 text-white hover:bg-white/15"
          aria-label="Fechar lista"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export function ListaInteligentePanel({
  variant,
  onClose,
  omitHeader = false,
}: ListaInteligentePanelProps) {
  const [remocaoPendente, setRemocaoPendente] = useState<ItemLista | null>(null);

  const {
    itens,
    removerItem,
    aplicarTrocaRota,
    restaurarItens,
    atualizarQuantidade,
    limparLista,
    total,
    totalItens,
    listaAtivaId,
    listasSalvas,
    criarNovaLista,
    selecionarLista,
    salvarListaAtual,
    deletarLista,
  } = useLista();
  const { success, error } = useToast();
  const [nomeLista, setNomeLista] = useState('');
  const [mostrarSeletorListas, setMostrarSeletorListas] = useState(false);
  const [secaoIaAberta, setSecaoIaAberta] = useState(true);
  const [propostaRota, setPropostaRota] = useState<PropostaRotaOtimizacao | null>(null);
  const [dismissedRotaChave, setDismissedRotaChave] = useState<string | null>(null);
  const [snapshotUndoRota, setSnapshotUndoRota] = useState<ItemLista[] | null>(null);

  const listaAtiva = listasSalvas.find((l) => l.id === listaAtivaId);

  const chaveListaRota = useMemo(
    () => itens.map((i) => `${i.id}:${i.quantidade}`).join('|'),
    [itens]
  );

  const insights = useMemo(() => {
    if (itens.length === 0) return null;
    const mercados = new Set(itens.map((i) => i.unidade.mercado.id));
    const comPromo = itens.filter((i) => i.emPromocao).length;
    const porMercado = new Map<string, number>();
    itens.forEach((i) => {
      const id = i.unidade.mercado.id;
      porMercado.set(id, (porMercado.get(id) ?? 0) + i.quantidade);
    });
    let topMercadoNome = '';
    let topQ = 0;
    porMercado.forEach((q, mid) => {
      if (q > topQ) {
        topQ = q;
        const item = itens.find((i) => i.unidade.mercado.id === mid);
        if (item) topMercadoNome = item.unidade.mercado.nome;
      }
    });
    return {
      mercados: mercados.size,
      emPromo: comPromo,
      topMercadoNome,
    };
  }, [itens]);

  const rota = useMemo(() => computeShoppingRoute(itens), [itens]);

  useEffect(() => {
    if (itens.length < 2 || (insights?.mercados ?? 0) < 2) {
      setPropostaRota(null);
      return;
    }
    if (dismissedRotaChave === chaveListaRota) return;
    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch('/api/cliente/rota-proposta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              itens: itens.map((i) => ({
                lineId: i.id,
                estoqueId: i.estoqueId,
                mercadoId: i.unidade.mercado.id,
                unidadeId: i.unidade.id,
                quantidade: i.quantidade,
              })),
            }),
          });
          const data = await res.json();
          if (data.proposal) setPropostaRota(data.proposal as PropostaRotaOtimizacao);
        } catch {
          setPropostaRota(null);
        }
      })();
    }, 700);
    return () => clearTimeout(t);
  }, [chaveListaRota, itens, insights?.mercados, dismissedRotaChave]);

  const aceitarPropostaRota = useCallback(() => {
    if (!propostaRota) return;
    const snap = itens.map((i) => ({ ...i }));
    const ids = propostaRota.movimentos.map((m) => m.removerLineId);
    const novos = propostaRota.movimentos.map((m) => ({ ...m.itemLista }));
    aplicarTrocaRota(ids, novos);
    setSnapshotUndoRota(snap);
    setPropostaRota(null);
    success('Rota otimizada: você pode desfazer se preferir o jeito anterior.');
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'anonymous' : 'anonymous';
    const mid = propostaRota.movimentos[0]?.itemLista.unidade.mercado.id ?? 'unknown';
    void recordRotaConsolidacaoLista(userId, mid, {
      acao: 'aceita',
      deltaTotal: propostaRota.resumo.deltaTotal,
      mercadosAntes: propostaRota.resumo.mercadosAntes,
      mercadosDepois: propostaRota.resumo.mercadosDepois,
      anchorNome: propostaRota.resumo.anchorNome,
    });
  }, [propostaRota, itens, aplicarTrocaRota, success]);

  const desfazerPropostaRota = useCallback(() => {
    if (!snapshotUndoRota?.length) return;
    restaurarItens(snapshotUndoRota);
    setSnapshotUndoRota(null);
    success('Lista restaurada como antes da otimização.');
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'anonymous' : 'anonymous';
    const mid = snapshotUndoRota[0]?.unidade.mercado.id ?? 'unknown';
    void recordRotaConsolidacaoLista(userId, mid, { acao: 'desfeita' });
  }, [snapshotUndoRota, restaurarItens, success]);

  useEffect(() => {
    if (itens.length > 0) setSecaoIaAberta(true);
  }, [itens.length]);

  const handleSalvarLista = () => {
    if (itens.length === 0) {
      error('Adicione produtos à lista antes de salvar.');
      return;
    }

    if (!nomeLista.trim() && !listaAtiva?.nome) {
      error('Informe um nome para salvar sua lista.');
      return;
    }

    try {
      salvarListaAtual((nomeLista.trim() || listaAtiva?.nome || 'Minha lista').trim());
      success('Lista salva com sucesso!');
      setNomeLista('');
    } catch (storageError) {
      console.error('Erro ao salvar lista:', storageError);
      error('Não foi possível salvar a lista. Tente novamente.');
    }
  };

  const confirmarRemocao = () => {
    if (!remocaoPendente) return;
    const item = remocaoPendente;
    setRemocaoPendente(null);
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('userId') || 'anonymous';
      const mercadoId = item.unidade.mercado.id;
      void recordRemocaoListaConfirmada(userId, mercadoId, {
        produtoId: item.id,
        listaId: listaAtivaId ?? undefined,
        aposInterrupcao: false,
      });
    }
    removerItem(item.id);
  };

  const handleCriarNovaLista = () => {
    if (itens.length > 0) {
      if (!confirm('Você tem itens na lista atual. Deseja criar uma nova lista vazia?')) {
        return;
      }
    }
    criarNovaLista('Nova Lista');
    setNomeLista('');
    success('Nova lista criada!');
  };

  const showHeaderClose = variant === 'inline' && !omitHeader;

  return (
    <div
      className={cn(
        // flex-1 + min-h-0: encaixa no drawer/viewport (h-full falha em vários mobile/Safari)
        'flex min-h-0 flex-1 flex-col overflow-hidden',
        variant === 'inline' &&
          'bg-[#e6e9ee] shadow-[inset_4px_0_12px_rgba(0,0,0,0.05),4px_0_16px_rgba(0,0,0,0.06)] lg:max-h-[calc(100dvh-2rem)] lg:min-h-0',
        omitHeader && 'bg-bg-paper'
      )}
    >
      {variant === 'inline' && !omitHeader && (
        <ListaInteligenteHeaderBlock onClose={onClose} showCloseButton={showHeaderClose} />
      )}

      {/* minmax(0,1fr): evita colapso da área rolável (flex bug) — rodapé não cobre os itens */}
      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
        <div className="min-h-0 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
          {mostrarSeletorListas && listasSalvas.length > 0 && (
        <div className="shrink-0 border-b border-gray-200 bg-gray-50 p-3">
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {listasSalvas.map((lista) => (
              <div
                key={lista.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    selecionarLista(lista.id);
                    setMostrarSeletorListas(false);
                  }
                }}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors',
                  lista.id === listaAtivaId ? 'bg-precivox-blue text-white' : 'bg-white hover:bg-gray-100'
                )}
                onClick={() => {
                  selecionarLista(lista.id);
                  setMostrarSeletorListas(false);
                }}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate text-sm font-medium',
                      lista.id === listaAtivaId ? 'text-white' : 'text-gray-900'
                    )}
                  >
                    {lista.nome}
                  </p>
                  <p
                    className={cn(
                      'text-xs',
                      lista.id === listaAtivaId ? 'text-blue-100' : 'text-gray-500'
                    )}
                  >
                    {lista.itens.length} itens · R$ {lista.total.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                {lista.id === listaAtivaId && <span className="text-xs text-blue-100">✓</span>}
                {listasSalvas.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Tem certeza que deseja excluir esta lista?')) {
                        deletarLista(lista.id);
                      }
                    }}
                    className={cn(
                      'ml-2 rounded p-1',
                      lista.id === listaAtivaId
                        ? 'text-white hover:bg-blue-700'
                        : 'text-red-600 hover:bg-red-100'
                    )}
                    title="Excluir lista"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCriarNovaLista}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-precivox-blue px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nova lista
          </button>
        </div>
      )}

      {insights && (
        <div className="border-b border-violet-100 bg-violet-50/90 px-4 py-3">
          <div className="flex items-center gap-2 text-violet-900">
            <Info className="h-4 w-4 shrink-0 text-violet-600" />
            <span className="text-sm font-semibold">Insights da sua lista</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-violet-800/95">
            {insights.mercados} {insights.mercados === 1 ? 'mercado' : 'mercados'} ·{' '}
            {insights.emPromo > 0 ? (
              <>
                {insights.emPromo} {insights.emPromo === 1 ? 'item' : 'itens'} em promoção
              </>
            ) : (
              'Nenhum item em promoção nesta seleção'
            )}
            {insights.topMercadoNome ? (
              <>
                {' '}
                · Maior volume: <span className="font-semibold">{insights.topMercadoNome}</span>
              </>
            ) : null}
          </p>
        </div>
      )}

      <div className="px-4 py-3">
        {itens.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center text-text-secondary">
            <ShoppingCart className="mb-4 h-16 w-16 text-gray-300" />
            <p className="mb-2 text-lg font-medium text-text-primary">Sua lista está vazia</p>
            <p className="text-sm text-text-secondary">
              Use <span className="font-medium text-gray-800">Adicionar à lista</span> nos produtos.
            </p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {remocaoPendente && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                <p className="text-sm font-semibold text-amber-950">Antes de remover</p>
                <p className="mt-2 text-xs leading-relaxed text-amber-950/90">
                  Esse tipo de item costuma ter ruptura na loja. Quer ver alternativas na busca antes de tirar da lista?
                </p>
                <p className="mt-2 text-xs leading-relaxed text-amber-950/90">
                  Confira também a disponibilidade na unidade para não precisar remover depois por frustração.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Link
                    href={`/cliente/busca?pref=${encodeURIComponent(remocaoPendente.nome.slice(0, 80))}`}
                    onClick={() => setRemocaoPendente(null)}
                    className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 text-xs font-semibold text-amber-950 shadow-sm ring-1 ring-amber-300 hover:bg-amber-100"
                  >
                    Ver alternativas (abre a busca)
                  </Link>
                  <button
                    type="button"
                    onClick={() => confirmarRemocao()}
                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    Remover mesmo assim
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemocaoPendente(null)}
                    className="rounded-lg border border-amber-300 bg-transparent px-3 py-2 text-xs font-medium text-amber-950 hover:bg-amber-100/80"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            {itens.map((item, index) => {
              const precoFinal =
                item.emPromocao && item.precoPromocional ? item.precoPromocional : item.preco;
              const pctOff =
                item.emPromocao && item.precoPromocional && item.preco > item.precoPromocional
                  ? Math.round((1 - item.precoPromocional / item.preco) * 100)
                  : null;

              return (
                <Card
                  key={item.id}
                  variant="default"
                  className="border border-gray-200/80 bg-[#f2f3f5] p-3 shadow-[3px_3px_8px_rgba(0,0,0,0.07),-2px_-2px_6px_rgba(255,255,255,0.85)]"
                >
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-precivox-blue text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="w-14 shrink-0">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                        {item.imagem ? (
                          <img src={item.imagem} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xl text-gray-400">📦</span>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-2 text-sm font-semibold text-text-primary">{item.nome}</h4>
                      <p className="text-xs text-text-secondary">{item.unidade.mercado.nome}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {item.emPromocao && item.precoPromocional ? (
                          <>
                            <span className="text-sm font-bold text-emerald-600">
                              R$ {item.precoPromocional.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-xs text-text-tertiary line-through">
                              R$ {item.preco.toFixed(2).replace('.', ',')}
                            </span>
                            {pctOff != null && pctOff > 0 && (
                              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700">
                                {pctOff}% off
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-sm font-bold text-text-primary">
                            R$ {item.preco.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Minus}
                          onClick={() => atualizarQuantidade(item.id, item.quantidade - 1)}
                          className="h-8 w-8 p-0"
                          aria-label="Diminuir quantidade"
                        >
                          <span className="sr-only">Diminuir</span>
                        </Button>
                        <span className="min-w-[2rem] text-center text-sm font-medium">{item.quantidade}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Plus}
                          onClick={() => atualizarQuantidade(item.id, item.quantidade + 1)}
                          className="h-8 w-8 border-emerald-200 p-0 text-emerald-700 hover:bg-emerald-50"
                          aria-label="Aumentar quantidade"
                        >
                          <span className="sr-only">Aumentar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => setRemocaoPendente(item)}
                          className="ml-auto h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          title="Remover item"
                          aria-label="Remover item"
                        >
                          <span className="sr-only">Remover</span>
                        </Button>
                      </div>
                      <p className="mt-1 text-xs font-medium text-text-secondary">
                        Subtotal: R$ {(precoFinal * item.quantidade).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* IA após os produtos: ao rolar, rota + “trocar por mais barato” ficam logo acima do fim do scroll */}
      {itens.length > 0 && (
        <div className="border-b border-emerald-200/80 bg-emerald-50/50 px-3 py-3">
          <button
            type="button"
            onClick={() => setSecaoIaAberta(!secaoIaAberta)}
            className="flex w-full items-center justify-between gap-2 rounded-xl bg-[#f4f7f5] px-3 py-2.5 text-left shadow-[inset_1px_1px_3px_rgba(255,255,255,0.8),2px_2px_6px_rgba(0,0,0,0.06)]"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
              IA · rota e dicas
            </span>
            <span className="shrink-0 text-xs font-medium text-emerald-800">
              {secaoIaAberta ? 'Ocultar' : 'Mostrar'}
            </span>
          </button>

          {secaoIaAberta && (
            <div className="mt-3 space-y-3 pb-1">
              <p className="text-xs leading-relaxed text-emerald-900/85">{dicaDeslocamento(insights?.mercados ?? 1)}</p>

              <div className="rounded-xl bg-white/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)]">
                <div className="mb-2 flex items-center gap-2 text-emerald-900">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wide">Rota sugerida</span>
                </div>
                <p className="mb-2 text-[11px] leading-snug text-gray-600">
                  Ordem para ir às lojas (compra presencial). Distâncias exatas em breve com localização.
                </p>
                <ol className="space-y-2">
                  {rota.map((passo) => (
                    <li
                      key={passo.mercadoId}
                      className="flex gap-2 rounded-lg border border-emerald-100/80 bg-emerald-50/40 px-2 py-2 text-xs"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                        {passo.ordem}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">{passo.mercadoNome}</p>
                        <p className="text-[11px] text-gray-600">
                          {passo.qtdLinhas} {passo.qtdLinhas === 1 ? 'produto' : 'produtos'} · Subtotal{' '}
                          <span className="font-medium text-emerald-700">
                            R$ {passo.subtotal.toFixed(2).replace('.', ',')}
                          </span>
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {propostaRota && (insights?.mercados ?? 0) >= 2 && (
                <div className="rounded-xl border border-sky-200/90 bg-gradient-to-br from-sky-50 to-white p-3 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-sky-950">
                    <Route className="h-4 w-4 shrink-0 text-sky-600" />
                    <span className="text-xs font-bold uppercase tracking-wide">Menos idas na rota</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-sky-950/90">
                    Trocar itens de <span className="font-semibold">{propostaRota.resumo.sateliteNome}</span> por
                    equivalentes de mesma categoria em{' '}
                    <span className="font-semibold">{propostaRota.resumo.anchorNome}</span> — de{' '}
                    {propostaRota.resumo.mercadosAntes} para {propostaRota.resumo.mercadosDepois}{' '}
                    {propostaRota.resumo.mercadosDepois === 1 ? 'mercado' : 'mercados'}.
                  </p>
                  <p className="mt-2 text-[11px] text-sky-900/85">
                    {propostaRota.resumo.deltaTotal > 0.01 ? (
                      <>
                        Impacto no total:{' '}
                        <span className="font-semibold text-amber-800">
                          +R$ {propostaRota.resumo.deltaTotal.toFixed(2).replace('.', ',')}
                        </span>{' '}
                        (trade-off: um pouco mais caro para concentrar a compra).
                      </>
                    ) : propostaRota.resumo.deltaTotal < -0.01 ? (
                      <>
                        Você economiza cerca de{' '}
                        <span className="font-semibold text-emerald-800">
                          R$ {Math.abs(propostaRota.resumo.deltaTotal).toFixed(2).replace('.', ',')}
                        </span>{' '}
                        no total estimado.
                      </>
                    ) : (
                      <>Impacto no total estimado: neutro.</>
                    )}
                  </p>
                  <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-[10px] text-sky-900/80">
                    {propostaRota.movimentos.map((m) => (
                      <li key={m.removerLineId} className="line-clamp-2">
                        · {m.nomeAnterior} → {m.nomeNovo}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={aceitarPropostaRota}
                      className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700"
                    >
                      Aceitar e aplicar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPropostaRota(null);
                        setDismissedRotaChave(chaveListaRota);
                      }}
                      className="rounded-lg border border-sky-300 bg-white px-3 py-2 text-xs font-medium text-sky-900 hover:bg-sky-50"
                    >
                      Ignorar sugestão
                    </button>
                  </div>
                </div>
              )}

              {snapshotUndoRota && snapshotUndoRota.length > 0 && (
                <button
                  type="button"
                  onClick={desfazerPropostaRota}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-xs font-semibold text-violet-900 shadow-sm hover:bg-violet-100/80"
                >
                  <Undo2 className="h-3.5 w-3.5 shrink-0" />
                  Desfazer última otimização de rota
                </button>
              )}

              <div className="flex gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50 p-3 shadow-sm">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="min-w-0 text-[11px] leading-relaxed text-amber-950">
                  <span className="mb-1 block text-xs font-bold text-amber-900">Trocar por mais barato</span>
                  Na busca, encontre o mesmo tipo de produto com preço menor e adicione à lista; remova o item
                  anterior se quiser. A lista atualiza na hora — ideal para economizar antes de ir às lojas.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

        </div>

        <div className="relative z-10 shrink-0 border-t border-gray-200/90 bg-gradient-to-b from-slate-50/90 to-bg-paper px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between gap-3 border-b border-gray-200/80 pb-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Total estimado</span>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-emerald-600">
                R$ {total.toFixed(2).replace('.', ',')}
              </p>
            </div>
            {listasSalvas.length > 1 && (
              <button
                type="button"
                onClick={() => setMostrarSeletorListas(!mostrarSeletorListas)}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 shadow-sm hover:bg-gray-50"
              >
                <ListOrdered className="h-3.5 w-3.5" />
                Trocar lista
              </button>
            )}
          </div>

          {itens.length > 0 && (
            <div className="mt-4 space-y-1.5">
              <label htmlFor="nome-lista-lateral" className="text-xs font-medium text-gray-700">
                Nome da lista
              </label>
              <input
                id="nome-lista-lateral"
                type="text"
                value={nomeLista || listaAtiva?.nome || ''}
                onChange={(e) => setNomeLista(e.target.value)}
                placeholder="Ex.: Lista do fim de semana"
                className="min-w-0 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3">
            <Link
              href="/cliente/listas"
              className="flex w-full items-center justify-center rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-violet-800 shadow-sm transition-colors hover:bg-violet-50"
            >
              Minhas listas
            </Link>

            {itens.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={limparLista}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-50"
                >
                  Limpar lista
                </button>
                <button
                  type="button"
                  onClick={handleSalvarLista}
                  className="rounded-xl bg-emerald-600 px-3 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  {listaAtiva ? 'Atualizar lista' : 'Salvar lista'}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-precivox-blue hover:bg-blue-50/80"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            Continuar comprando
          </button>
        </div>
      </div>
    </div>
  );
}
