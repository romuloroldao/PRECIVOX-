'use client';

import { useState, useEffect } from 'react';
import { useLista } from '@/app/context/ListaContext';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
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
    deletarLista
  } = useLista();
  const { success, error } = useToast();
  const [nomeLista, setNomeLista] = useState('');
  const [mostrarSeletorListas, setMostrarSeletorListas] = useState(false);

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

    if (!nomeLista.trim()) {
      error('Informe um nome para salvar sua lista.');
      return;
    }

    try {
      salvarListaAtual(nomeLista.trim());
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

  const listaAtiva = listasSalvas.find(l => l.id === listaAtivaId);

  // Versão retraída (apenas ícone)
  if (!expandida) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-4 bottom-6 z-40 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 hover:shadow-md transition-all duration-200 flex items-center justify-center relative"
        title="Minha Lista de Compras"
        aria-label="Abrir lista de compras"
      >
        <ShoppingCart className="w-6 h-6" />
        {totalItens > 0 && (
          <span className="absolute -top-1 -right-1 bg-success-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {totalItens > 99 ? '99+' : totalItens}
          </span>
        )}
      </button>
    );
  }

  // Versão expandida - Desktop usa Drawer lateral, Mobile usa Drawer bottom
  return (
    <>
      <Drawer
        isOpen={expandida}
        onClose={onToggle}
        title={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-text-primary" />
              <span className="font-semibold text-text-primary">
                {listaAtiva?.nome || 'Minha Lista'}
              </span>
              {totalItens > 0 && (
                <span className="bg-success-100 text-success-700 px-2 py-0.5 rounded-full text-xs font-bold">
                  {totalItens}
                </span>
              )}
            </div>
            {listasSalvas.length > 1 && (
              <button
                onClick={() => setMostrarSeletorListas(!mostrarSeletorListas)}
                className="text-xs text-text-secondary hover:text-text-primary"
                title="Alternar entre listas"
              >
                {mostrarSeletorListas ? '▼' : '▶'} Listas
              </button>
            )}
          </div>
        }
        position="right"
        size="lg"
      >
        <div className="flex h-full flex-col">
          {/* Seletor de Listas */}
          {mostrarSeletorListas && listasSalvas.length > 0 && (
            <div className="border-b border-gray-200 p-3 bg-gray-50">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {listasSalvas.map((lista) => (
                  <div
                    key={lista.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      lista.id === listaAtivaId
                        ? 'bg-precivox-blue text-white'
                        : 'bg-white hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      selecionarLista(lista.id);
                      setMostrarSeletorListas(false);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        lista.id === listaAtivaId ? 'text-white' : 'text-gray-900'
                      }`}>
                        {lista.nome}
                      </p>
                      <p className={`text-xs ${
                        lista.id === listaAtivaId ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {lista.itens.length} itens • R$ {lista.total.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    {lista.id === listaAtivaId && (
                      <span className="text-xs text-blue-100">✓</span>
                    )}
                    {listasSalvas.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Tem certeza que deseja excluir esta lista?')) {
                            deletarLista(lista.id);
                          }
                        }}
                        className={`ml-2 p-1 rounded ${
                          lista.id === listaAtivaId
                            ? 'hover:bg-blue-700 text-white'
                            : 'hover:bg-red-100 text-red-600'
                        }`}
                        title="Excluir lista"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleCriarNovaLista}
                className="mt-2 w-full px-3 py-2 text-sm bg-precivox-blue text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova Lista
              </button>
            </div>
          )}
          
          {/* Lista de itens */}
          <div className="flex-1 overflow-y-auto pr-1">
          {itens.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-text-secondary py-12 px-4">
              <ShoppingCart className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium text-text-primary mb-2">Sua lista está vazia</p>
                <p className="text-sm text-text-secondary">
                  Adicione produtos à sua lista de compras.
                </p>
            </div>
          ) : (
              <div className="space-y-3 pb-28">
            {itens.map((item) => {
                  const precoFinal =
                    item.emPromocao && item.precoPromocional ? item.precoPromocional : item.preco;
              
              return (
                    <Card key={item.id} variant="default" className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Imagem */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.imagem ? (
                        <img
                          src={item.imagem}
                          alt={item.nome}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-gray-400 text-2xl">📦</span>
                      )}
                    </div>

                    {/* Informações */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-text-primary text-sm line-clamp-2 mb-1">
                        {item.nome}
                      </h4>
                      <p className="text-xs text-text-secondary mb-2">
                        {item.unidade.mercado.nome}
                      </p>
                      
                      {/* Preço */}
                      <div className="mb-2">
                        {item.emPromocao && item.precoPromocional ? (
                          <div className="flex items-baseline gap-1">
                                <span className="text-sm font-bold text-success-600">
                              R$ {item.precoPromocional.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-xs text-text-tertiary line-through">
                              R$ {item.preco.toFixed(2).replace('.', ',')}
                            </span>
                                <span className="ml-2 inline-flex items-center rounded-full bg-promo-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-promo-700">
                                  Promoção
                                </span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-text-primary">
                            R$ {item.preco.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>

                      {/* Controles de quantidade */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Minus}
                          onClick={() => atualizarQuantidade(item.id, item.quantidade - 1)}
                          className="w-8 h-8 p-0"
                          aria-label="Diminuir quantidade"
                        >
                          <span className="sr-only">Diminuir</span>
                        </Button>
                        <span className="text-sm font-medium text-text-primary min-w-[2rem] text-center">
                          {item.quantidade}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Plus}
                          onClick={() => atualizarQuantidade(item.id, item.quantidade + 1)}
                          className="w-8 h-8 p-0"
                          aria-label="Aumentar quantidade"
                        >
                          <span className="sr-only">Aumentar</span>
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => removerItem(item.id)}
                          className="ml-auto w-8 h-8 p-0 text-error-600 hover:text-error-700 hover:bg-error-50"
                          title="Remover item"
                          aria-label="Remover item"
                        >
                          <span className="sr-only">Remover</span>
                        </Button>
                      </div>

                      {/* Subtotal do item */}
                      <p className="text-xs text-text-secondary mt-2 font-medium">
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

          {/* Footer com total e ações */}
          <div className="pointer-events-none">
            <div className="pointer-events-auto sticky bottom-0 -mx-4 -mb-4 border-t border-gray-200 bg-bg-paper px-4 py-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-text-secondary block">Total estimado</span>
                    <span className="text-2xl font-bold text-success-600">
                R$ {total.toFixed(2).replace('.', ',')}
              </span>
                  </div>
                  {itens.length > 0 && (
                    <span className="rounded-full bg-success-100 px-3 py-1 text-xs font-semibold text-success-700">
                      {totalItens} {totalItens === 1 ? 'item' : 'itens'}
                    </span>
                  )}
                </div>

                {itens.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="nome-lista" className="text-xs font-medium text-text-secondary">
                        {listaAtiva ? 'Renomear lista' : 'Nome da lista'}
                      </label>
                      <input
                        id="nome-lista"
                        type="text"
                        value={nomeLista || listaAtiva?.nome || ''}
                        onChange={(event) => setNomeLista(event.target.value)}
                        placeholder={listaAtiva?.nome || "Ex: Compras do mês"}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-success-500 focus:outline-none focus:ring-2 focus:ring-success-200"
                      />
                    </div>
            
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full border border-transparent text-error-600 hover:bg-error-50 hover:text-error-700"
                        onClick={limparLista}
                      >
                        Limpar Lista
                      </Button>
                      <Button
                        type="button"
                        variant="success"
                        className="w-full"
                        onClick={handleSalvarLista}
                      >
                        {listaAtiva ? 'Atualizar Lista' : 'Salvar Lista'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
}

