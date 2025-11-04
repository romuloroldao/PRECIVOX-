'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ItemLista {
  id: string;
  estoqueId: string;
  nome: string;
  preco: number;
  precoPromocional?: number;
  emPromocao: boolean;
  quantidade: number;
  imagem?: string;
  categoria?: string;
  marca?: string;
  unidade: {
    id: string;
    nome: string;
    mercado: {
      id: string;
      nome: string;
    };
  };
}

interface ListaContextType {
  itens: ItemLista[];
  adicionarItem: (item: ItemLista) => void;
  removerItem: (id: string) => void;
  atualizarQuantidade: (id: string, quantidade: number) => void;
  limparLista: () => void;
  total: number;
  totalItens: number;
}

const ListaContext = createContext<ListaContextType | undefined>(undefined);

export function ListaProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemLista[]>([]);

  // Carregar do localStorage ao montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const listaSalva = localStorage.getItem('precivox_lista_compras');
      if (listaSalva) {
        try {
          setItens(JSON.parse(listaSalva));
        } catch (error) {
          console.error('Erro ao carregar lista:', error);
        }
      }
    }
  }, []);

  // Salvar no localStorage sempre que a lista mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('precivox_lista_compras', JSON.stringify(itens));
    }
  }, [itens]);

  const adicionarItem = (item: ItemLista) => {
    setItens((prevItens) => {
      // Verificar se o item já existe
      const itemExistente = prevItens.find((i) => i.id === item.id);
      if (itemExistente) {
        // Aumentar quantidade
        return prevItens.map((i) =>
          i.id === item.id
            ? { ...i, quantidade: i.quantidade + 1 }
            : i
        );
      }
      // Adicionar novo item
      return [...prevItens, { ...item, quantidade: 1 }];
    });
  };

  const removerItem = (id: string) => {
    setItens((prevItens) => prevItens.filter((item) => item.id !== id));
  };

  const atualizarQuantidade = (id: string, quantidade: number) => {
    if (quantidade <= 0) {
      removerItem(id);
      return;
    }
    setItens((prevItens) =>
      prevItens.map((item) =>
        item.id === id ? { ...item, quantidade } : item
      )
    );
  };

  const limparLista = () => {
    setItens([]);
  };

  const total = itens.reduce((acc, item) => {
    const preco = item.emPromocao && item.precoPromocional 
      ? item.precoPromocional 
      : item.preco;
    return acc + preco * item.quantidade;
  }, 0);

  const totalItens = itens.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <ListaContext.Provider
      value={{
        itens,
        adicionarItem,
        removerItem,
        atualizarQuantidade,
        limparLista,
        total,
        totalItens,
      }}
    >
      {children}
    </ListaContext.Provider>
  );
}

export function useLista() {
  const context = useContext(ListaContext);
  if (context === undefined) {
    throw new Error('useLista deve ser usado dentro de ListaProvider');
  }
  return context;
}

