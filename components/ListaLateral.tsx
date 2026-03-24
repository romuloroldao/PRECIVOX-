'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useLista } from '@/app/context/ListaContext';
import { ShoppingCart, Plus, Minus, Trash2, Sparkles, ListOrdered, ChevronLeft, Info } from 'lucide-react';
import { Drawer, Button, Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ToastContainer';

interface ListaLateralProps {
  expandida: boolean;
  onToggle: () => void;
}

export function ListaLateral({ expandida, onToggle }: ListaLateralProps) {
  const {
    itens,
    removerItem,
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

  const listaAtiva = listasSalvas.find((l) => l.id === listaAtivaId);

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

  useEffect(() => {
    if (!expandida) {
      setNomeLista('');
    }
  }, [expandida]);

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

  /* Botão flutuante: só quando painel fechado; em telas grandes o atalho principal fica na barra de filtros */
  if (!expandida) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'fixed bottom-6 right-4 z-40 flex items-center justify-center rounded-full bg-precivox-blue p-4 text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-md md:hidden'
        )}
        title="Abrir lista inteligente"
        aria-label="Abrir lista inteligente de compras"
      >
        <ShoppingCart className="h-6 w-6" />
        {totalItens > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-emerald-600 px-1 text-xs font-bold text-white">
            {totalItens > 99 ? '99+' : totalItens}
          </span>
        )}
      </button>
    );
  }

  return (
    <Drawer
      id="lista-inteligente-panel"
      isOpen={expandida}
      onClose={onToggle}
      position="right"
      size="lg"
      titleBarClassName="border-0 bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 text-white shadow-md"
      innerClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-0"
      title={
        <div className="flex w-full min-w-0 items-start justify-between gap-2 pr-2">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
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
                    <span className="font-bold tabular-nums">
                      R$ {total.toFixed(2).replace('.', ',')}
                    </span>
                  </>
                ) : (
                  'Nenhum item ainda'
                )}
              </p>
            </div>
          </div>
        </div>
      }
      drawerClassName="border-l border-emerald-900/10"
      closeButtonClassName="text-white hover:bg-white/15"
    >
      <div className="flex h-full min-h-0 flex-col">
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
          <div className="shrink-0 border-b border-violet-100 bg-violet-50/90 px-4 py-3">
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

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {itens.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center text-text-secondary">
              <ShoppingCart className="mb-4 h-16 w-16 text-gray-300" />
              <p className="mb-2 text-lg font-medium text-text-primary">Sua lista está vazia</p>
              <p className="text-sm text-text-secondary">
                Use <span className="font-medium text-gray-800">Adicionar à lista</span> nos produtos — o painel abre
                automaticamente junto dos filtros.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {itens.map((item, index) => {
                const precoFinal =
                  item.emPromocao && item.precoPromocional ? item.precoPromocional : item.preco;
                const pctOff =
                  item.emPromocao && item.precoPromocional && item.preco > item.precoPromocional
                    ? Math.round((1 - item.precoPromocional / item.preco) * 100)
                    : null;

                return (
                  <Card key={item.id} variant="default" className="p-3">
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-precivox-blue text-sm font-bold text-white">
                        {index + 1}
                      </div>
                      <div className="w-14 shrink-0">
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                          {item.imagem ? (
                            <img
                              src={item.imagem}
                              alt=""
                              className="h-full w-full object-cover"
                            />
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
                            onClick={() => removerItem(item.id)}
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

        <div className="shrink-0 border-t border-gray-200 bg-bg-paper px-4 pb-4 pt-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <span className="text-xs text-text-secondary">Total estimado</span>
              <p className="text-2xl font-bold tabular-nums text-emerald-600">
                R$ {total.toFixed(2).replace('.', ',')}
              </p>
            </div>
            {listasSalvas.length > 1 && (
              <button
                type="button"
                onClick={() => setMostrarSeletorListas(!mostrarSeletorListas)}
                className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <ListOrdered className="h-3.5 w-3.5" />
                Trocar lista
              </button>
            )}
          </div>

          {itens.length > 0 && (
            <div className="mb-3 space-y-2">
              <label htmlFor="nome-lista-lateral" className="text-xs font-medium text-text-secondary">
                Nome da lista
              </label>
              <div className="flex gap-2">
                <input
                  id="nome-lista-lateral"
                  type="text"
                  value={nomeLista || listaAtiva?.nome || ''}
                  onChange={(e) => setNomeLista(e.target.value)}
                  placeholder="Ex.: Lista do fim de semana"
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-precivox-blue focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/cliente/comparar"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700"
            >
              <Sparkles className="h-4 w-4" />
              Comparar / IA
            </Link>
            <Link
              href="/cliente/listas"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-800 transition-colors hover:bg-violet-50"
            >
              Minhas listas
            </Link>
          </div>

          {itens.length > 0 && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                className="w-full border border-transparent text-red-600 hover:bg-red-50"
                onClick={limparLista}
              >
                Limpar lista
              </Button>
              <Button type="button" variant="success" className="w-full" onClick={handleSalvarLista}>
                {listaAtiva ? 'Atualizar lista' : 'Salvar lista'}
              </Button>
            </div>
          )}

          <button
            type="button"
            onClick={onToggle}
            className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-medium text-precivox-blue hover:underline"
          >
            <ChevronLeft className="h-4 w-4" />
            Continuar comprando
          </button>
        </div>
      </div>
    </Drawer>
  );
}
