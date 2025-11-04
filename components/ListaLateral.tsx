'use client';

import { useLista } from '@/app/context/ListaContext';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { Drawer, Button, Card } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ListaLateralProps {
  expandida: boolean;
  onToggle: () => void;
}

export function ListaLateral({ expandida, onToggle }: ListaLateralProps) {
  const { itens, removerItem, atualizarQuantidade, limparLista, total, totalItens } = useLista();

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
          <span className="absolute -top-1 -right-1 bg-error-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
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
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <span>Minha Lista</span>
            {totalItens > 0 && (
              <span className="bg-primary-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                {totalItens}
              </span>
            )}
          </div>
        }
        position="responsive"
        size="md"
      >
        {/* Lista de itens */}
        <div className="flex-1 overflow-y-auto">
          {itens.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary py-12 px-4">
              <ShoppingCart className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium text-text-primary mb-2">Sua lista está vazia</p>
              <p className="text-sm text-text-secondary">Adicione produtos à sua lista de compras</p>
            </div>
          ) : (
            <div className="space-y-3">
            {itens.map((item) => {
              const precoFinal = item.emPromocao && item.precoPromocional 
                ? item.precoPromocional 
                : item.preco;
              
              return (
                <Card
                  key={item.id}
                  variant="default"
                  className="p-4"
                >
                  <div className="flex items-start gap-4">
                    {/* Imagem */}
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
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
                            <span className="text-sm font-bold text-primary-600">
                              R$ {item.precoPromocional.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-xs text-text-tertiary line-through">
                              R$ {item.preco.toFixed(2).replace('.', ',')}
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

        {/* Footer com total */}
        {itens.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-bg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold text-text-primary">Total:</span>
              <span className="text-2xl font-bold text-primary-600">
                R$ {total.toFixed(2).replace('.', ',')}
              </span>
            </div>
            
            <Button
              variant="error"
              size="md"
              onClick={limparLista}
              className="w-full"
            >
              Limpar Lista
            </Button>
          </div>
        )}
      </Drawer>
    </>
  );
}

