'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLista, type ItemLista as ItemListaType } from '@/app/context/ListaContext';
import { recordRemocaoListaConfirmada, recordRotaConsolidacaoLista } from '@/lib/events/frontend-events';
import type { PropostaRotaOtimizacao } from '@/lib/lista-rota-proposta';
import {
  ShoppingCart,
  Sparkles,
  MapPin,
  X,
  Lightbulb,
  Route,
  Undo2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { UX } from '@/lib/ux-copy';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ToastContainer';
import { computeShoppingRoute, dicaDeslocamento } from '@/lib/lista-rota-ia';
import type { RotaPasso } from '@/lib/lista-rota-ia';
import { BasketCompletionBlock } from '@/components/cliente/BasketCompletionBlock';
import { ListaItemRow } from '@/components/lista-inteligente/ListaItemRow';
import { ListaFooter } from '@/components/lista-inteligente/ListaFooter';
import { ListaMenuSheet } from '@/components/lista-inteligente/ListaMenuSheet';

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
  compact = false,
}: {
  onClose: () => void;
  showCloseButton: boolean;
  compact?: boolean;
}) {
  const { total, totalItens } = useLista();

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-start justify-between gap-2 border-0 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-md',
        compact ? 'p-3' : 'p-4'
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2)]',
            compact ? 'h-8 w-8' : 'h-10 w-10'
          )}
        >
          <ShoppingCart className={compact ? 'h-4 w-4 text-white' : 'h-5 w-5 text-white'} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-100/90">
            Lista ativa
          </p>
          <h2 className={cn('truncate font-bold leading-tight text-white', compact ? 'text-base' : 'text-lg')}>
            {UX.lista.titulo}
          </h2>
          <p className={cn('text-emerald-50', compact ? 'text-xs' : 'mt-0.5 text-sm')}>
            {totalItens > 0 ? (
              <>
                <span className="font-semibold">{totalItens}</span>{' '}
                {totalItens === 1 ? 'item' : 'itens'} ·{' '}
                <span className="font-bold tabular-nums">R$ {total.toFixed(2).replace('.', ',')}</span>
              </>
            ) : (
              UX.lista.subtituloVazia
            )}
          </p>
        </div>
      </div>
      {showCloseButton && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-white hover:bg-white/15"
          aria-label="Recolher lista"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Painel principal
// ───────────────────────────────────────────────────────────
export function ListaInteligentePanel({
  variant,
  onClose,
  omitHeader = false,
}: ListaInteligentePanelProps) {
  const {
    itens,
    removerItem,
    restaurarItem,
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
  const { success, error, warning, showToast } = useToast();

  const [menuAberto, setMenuAberto] = useState(false);
  const [secaoIaAberta, setSecaoIaAberta] = useState(false);
  const [propostaRota, setPropostaRota] = useState<PropostaRotaOtimizacao | null>(null);
  const [dismissedRotaChave, setDismissedRotaChave] = useState<string | null>(null);
  const [snapshotUndoRota, setSnapshotUndoRota] = useState<ItemListaType[] | null>(null);
  const [rotaOtimizada, setRotaOtimizada] = useState<{
    passos: RotaPasso[];
    distanciaTotalKm: number | null;
    metodo: 'valor' | 'geo';
  } | null>(null);
  const [confirmLimpar, setConfirmLimpar] = useState(false);
  const [nomeEditando, setNomeEditando] = useState(false);
  const [nomeLista, setNomeLista] = useState('');

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
    return { mercados: mercados.size, emPromo: comPromo, topMercadoNome };
  }, [itens]);

  const rotaFallback = useMemo(() => computeShoppingRoute(itens), [itens]);
  const rota = rotaOtimizada?.passos ?? rotaFallback;
  const kmRota = rotaOtimizada?.distanciaTotalKm ?? null;

  useEffect(() => {
    if (itens.length < 2 || (insights?.mercados ?? 0) < 2) {
      setRotaOtimizada(null);
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch('/api/cliente/rota-otimizada', {
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
                mercadoNome: i.unidade.mercado.nome,
                produtoNome: i.nome,
                preco: i.preco,
                precoPromocional: i.precoPromocional,
                emPromocao: i.emPromocao,
              })),
            }),
          });
          const data = await res.json();
          if (data.rota?.passos?.length) {
            setRotaOtimizada({
              passos: data.rota.passos.map((p: RotaPasso) => ({
                ...p,
                itens: itens.filter((i) => i.unidade.mercado.id === p.mercadoId),
              })),
              distanciaTotalKm: data.rota.distanciaTotalKm ?? null,
              metodo: data.rota.metodo ?? 'valor',
            });
          } else {
            setRotaOtimizada(null);
          }
        } catch {
          setRotaOtimizada(null);
        }
      })();
    }, 500);
    return () => clearTimeout(t);
  }, [chaveListaRota, itens, insights?.mercados]);

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
    success('Rota otimizada! Você pode desfazer se quiser.');
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

  // Abre a seção de IA ao atingir 2+ mercados
  useEffect(() => {
    if (variant === 'inline') return;
    if ((insights?.mercados ?? 0) >= 2) setSecaoIaAberta(true);
  }, [insights?.mercados, variant]);

  const handleRemoverItem = useCallback(
    (item: ItemListaType) => {
      const snapshot = { ...item };
      removerItem(item.id);
      showToast(UX.lista.itemRemovido, 'info', 5000, {
        label: UX.lista.desfazer,
        onClick: () => restaurarItem(snapshot),
      });
      if (typeof window !== 'undefined') {
        const userId = localStorage.getItem('userId') || 'anonymous';
        const mercadoId = item.unidade.mercado.id;
        void recordRemocaoListaConfirmada(userId, mercadoId, {
          produtoId: item.id,
          listaId: listaAtivaId ?? undefined,
          aposInterrupcao: false,
        });
      }
    },
    [removerItem, restaurarItem, listaAtivaId, showToast]
  );

  const handleSalvarLista = useCallback(() => {
    if (itens.length === 0) {
      error('Adicione produtos antes de salvar.');
      return;
    }
    const nome = (nomeLista.trim() || listaAtiva?.nome || 'Minha lista').trim();
    try {
      salvarListaAtual(nome);
      success('Lista salva!');
      setNomeEditando(false);
      setNomeLista('');
    } catch {
      error('Não foi possível salvar. Tente novamente.');
    }
  }, [itens.length, nomeLista, listaAtiva?.nome, salvarListaAtual, success, error]);

  const handleCriarNovaLista = () => {
    if (itens.length > 0) {
      warning('A lista atual será mantida. A nova lista começa vazia.');
    }
    criarNovaLista('Nova Lista');
    setNomeLista('');
    success('Nova lista criada!');
  };

  const handleLimparLista = () => {
    limparLista();
    setConfirmLimpar(false);
    success('Lista esvaziada.');
  };

  const isCompact = variant === 'inline';

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-bg-paper">
      {(variant === 'inline' || variant === 'drawer') && !omitHeader && (
        <ListaInteligenteHeaderBlock
          onClose={onClose}
          showCloseButton={variant === 'drawer'}
          compact={variant === 'drawer'}
        />
      )}

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
        {/* ── Área rolável ── */}
        <div className="min-h-0 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">

          {/* Chip de rota — múltiplos mercados */}
          {insights && insights.mercados >= 2 && (
            <div className={cn('border-b border-emerald-100 bg-emerald-50/90', isCompact ? 'px-3 py-2' : 'px-4 py-3')}>
              <div className="flex items-center gap-1.5 text-emerald-900">
                <Route className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className={cn('font-semibold', isCompact ? 'text-xs' : 'text-sm')}>Dica de economia</span>
              </div>
              <p className={cn('leading-snug text-emerald-900/90', isCompact ? 'mt-1 text-[11px]' : 'mt-1.5 text-xs')}>
                {propostaRota && propostaRota.resumo.deltaTotal > 0.01 ? (
                  <>
                    Concentrar em <span className="font-semibold">{propostaRota.resumo.anchorNome}</span> pode
                    economizar{' '}
                    <span className="font-bold tabular-nums">
                      R$ {propostaRota.resumo.deltaTotal.toFixed(2).replace('.', ',')}
                    </span>
                    .
                  </>
                ) : (
                  <>
                    Você tem itens em {insights.mercados} mercados. Veja abaixo se vale concentrar as
                    compras.
                  </>
                )}
              </p>
            </div>
          )}

          {/* Lista de itens */}
          <div className={cn(isCompact ? 'px-2 py-2' : 'px-3 py-3')}>
            {itens.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
                <ShoppingCart className="mb-4 h-14 w-14 text-gray-200" />
                <p className="mb-1 text-base font-semibold text-text-primary">Lista vazia</p>
                <p className="max-w-[200px] text-sm text-text-secondary">
                  Toque em <span className="font-medium text-gray-800">Adicionar à lista</span> em qualquer produto.
                </p>
              </div>
            ) : (
              <div className={cn(isCompact ? 'space-y-1.5 pb-2' : 'space-y-2.5 pb-3')}>
                {itens.map((item, index) => (
                  <ListaItemRow
                    key={item.id}
                    item={item}
                    index={index}
                    onRemover={handleRemoverItem}
                    onAtualizarQtd={atualizarQuantidade}
                    compact={isCompact}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Seção IA — collapsível */}
          {itens.length > 0 && (
            <div className="border-t border-emerald-200/80 bg-emerald-50/50 px-3 py-3">
              <button
                type="button"
                onClick={() => setSecaoIaAberta(!secaoIaAberta)}
                className="flex w-full items-center justify-between gap-2 rounded-xl bg-[#f4f7f5] px-3 py-2.5 text-left shadow-[inset_1px_1px_3px_rgba(255,255,255,0.8),2px_2px_6px_rgba(0,0,0,0.06)]"
                aria-expanded={secaoIaAberta}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                  <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
                  {UX.lista.rotaIa}
                </span>
                {secaoIaAberta ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-emerald-700" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-emerald-700" />
                )}
              </button>

              {secaoIaAberta && (
                <div className="mt-3 space-y-3 pb-1">
                  <BasketCompletionBlock itens={itens} />

                  <p className="text-xs leading-relaxed text-emerald-900/85">
                    {dicaDeslocamento(insights?.mercados ?? 1, kmRota)}
                  </p>

                  {/* Rota sugerida */}
                  <div className="rounded-xl bg-white/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)]">
                    <div className="mb-2 flex items-center gap-2 text-emerald-900">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-bold uppercase tracking-wide">Ordem sugerida de visita</span>
                      {rotaOtimizada?.metodo === 'geo' && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                          por proximidade
                        </span>
                      )}
                    </div>
                    <p className="mb-2 text-[11px] leading-snug text-gray-500">
                      Para compras presenciais.
                      {kmRota != null && kmRota > 0 && <> Distância estimada: ~{kmRota} km.</>}
                    </p>
                    <ol className="space-y-1.5">
                      {rota.map((passo) => (
                        <li
                          key={passo.mercadoId}
                          className="flex gap-2 rounded-lg border border-emerald-100/80 bg-emerald-50/40 px-2.5 py-2 text-xs"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                            {passo.ordem}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900">{passo.mercadoNome}</p>
                            <p className="text-[11px] text-gray-500">
                              {passo.qtdLinhas} {passo.qtdLinhas === 1 ? 'produto' : 'produtos'} · R${' '}
                              {passo.subtotal.toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Proposta de consolidação de rota */}
                  {propostaRota && (insights?.mercados ?? 0) >= 2 && (
                    <div className="rounded-xl border border-sky-200/90 bg-gradient-to-br from-sky-50 to-white p-3 shadow-sm">
                      <div className="mb-2 flex items-center gap-2 text-sky-950">
                        <Route className="h-4 w-4 shrink-0 text-sky-600" />
                        <span className="text-xs font-bold uppercase tracking-wide">Menos deslocamento</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-sky-950/90">
                        Trocar itens de{' '}
                        <span className="font-semibold">{propostaRota.resumo.sateliteNome}</span> por
                        equivalentes em{' '}
                        <span className="font-semibold">{propostaRota.resumo.anchorNome}</span> — de{' '}
                        {propostaRota.resumo.mercadosAntes} para {propostaRota.resumo.mercadosDepois}{' '}
                        {propostaRota.resumo.mercadosDepois === 1 ? 'mercado' : 'mercados'}.
                      </p>
                      <p className="mt-1.5 text-[11px] text-sky-900/80">
                        {propostaRota.resumo.deltaTotal > 0.01 ? (
                          <>
                            Impacto:{' '}
                            <span className="font-semibold text-amber-700">
                              +R$ {propostaRota.resumo.deltaTotal.toFixed(2).replace('.', ',')}
                            </span>{' '}
                            (um pouco mais caro, mas menos lojas).
                          </>
                        ) : propostaRota.resumo.deltaTotal < -0.01 ? (
                          <>
                            Você economiza{' '}
                            <span className="font-semibold text-emerald-700">
                              R$ {Math.abs(propostaRota.resumo.deltaTotal).toFixed(2).replace('.', ',')}
                            </span>{' '}
                            e ainda concentra a compra.
                          </>
                        ) : (
                          'Sem diferença no total estimado.'
                        )}
                      </p>
                      <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-[10px] text-sky-900/75">
                        {propostaRota.movimentos.map((m) => (
                          <li key={m.removerLineId} className="line-clamp-1">
                            · {m.nomeAnterior} → {m.nomeNovo}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={aceitarPropostaRota}
                          className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 active:scale-95"
                        >
                          Aplicar sugestão
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPropostaRota(null);
                            setDismissedRotaChave(chaveListaRota);
                          }}
                          className="rounded-xl border border-sky-200 bg-white px-4 py-2 text-xs font-medium text-sky-800 transition-colors hover:bg-sky-50"
                        >
                          Ignorar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Desfazer otimização */}
                  {snapshotUndoRota && snapshotUndoRota.length > 0 && (
                    <button
                      type="button"
                      onClick={desfazerPropostaRota}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-xs font-semibold text-violet-900 shadow-sm transition-colors hover:bg-violet-100/80 active:scale-95"
                    >
                      <Undo2 className="h-3.5 w-3.5 shrink-0" />
                      Desfazer última otimização
                    </button>
                  )}

                  {/* Dica de substituição */}
                  <div className="flex gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50 p-3 shadow-sm">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div className="min-w-0 text-[11px] leading-relaxed text-amber-900">
                      <span className="mb-0.5 block text-xs font-bold text-amber-800">Economize mais</span>
                      Encontre o mesmo produto mais barato na busca, adicione à lista e remova o anterior.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <ListaFooter
          total={total}
          itensCount={totalItens}
          isCompact={isCompact}
          confirmLimpar={confirmLimpar}
          onClose={onClose}
          onFinalizar={onClose}
          onEsvaziarClick={() => setConfirmLimpar(true)}
          onCancelarEsvaziar={() => setConfirmLimpar(false)}
          onConfirmarEsvaziar={handleLimparLista}
          onAbrirMenu={() => setMenuAberto(true)}
        />
      </div>

      <ListaMenuSheet
        isOpen={menuAberto}
        onClose={() => setMenuAberto(false)}
        listasSalvas={listasSalvas}
        listaAtivaId={listaAtivaId}
        onSelecionarLista={selecionarLista}
        onCriarNova={handleCriarNovaLista}
        onRenomear={() => setNomeEditando(true)}
        onEsvaziar={() => setConfirmLimpar(true)}
        onDeletarLista={deletarLista}
      />

      {nomeEditando && (
        <div className="absolute bottom-20 left-0 right-0 z-20 border-t border-slate-200 bg-white p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={nomeLista || listaAtiva?.nome || ''}
              onChange={(e) => setNomeLista(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSalvarLista();
                if (e.key === 'Escape') setNomeEditando(false);
              }}
              placeholder="Nome da lista"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <Button variant="primary" size="sm" onClick={handleSalvarLista}>
              {UX.geral.salvar}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
