'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { recordProductAddedToList, recordProductRemovedFromList } from '@/lib/events/frontend-events';

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

export interface ListaSalva {
  id: string;
  nome: string;
  criadaEm: string;
  itens: ItemLista[];
  total: number;
}

interface ListaContextType {
  itens: ItemLista[];
  listaAtivaId: string | null;
  listasSalvas: ListaSalva[];
  adicionarItem: (item: ItemLista) => void;
  removerItem: (id: string) => void;
  atualizarQuantidade: (id: string, quantidade: number) => void;
  limparLista: () => void;
  criarNovaLista: (nome: string) => string;
  selecionarLista: (listaId: string) => void;
  salvarListaAtual: (nome: string) => void;
  deletarLista: (listaId: string) => void;
  total: number;
  totalItens: number;
}

const ListaContext = createContext<ListaContextType | undefined>(undefined);

const STORAGE_KEY_LISTAS = 'precivox_listas_salvas';
const STORAGE_KEY_LISTA_ATIVA = 'precivox_lista_ativa_id';

export function ListaProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemLista[]>([]);
  const [listaAtivaId, setListaAtivaId] = useState<string | null>(null);
  const [listasSalvas, setListasSalvas] = useState<ListaSalva[]>([]);

  const criarNovaLista = useCallback((nome: string): string => {
    const novaLista: ListaSalva = {
      id: `lista-${Date.now()}`,
      nome,
      criadaEm: new Date().toISOString(),
      itens: [],
      total: 0,
    };
    
    setListasSalvas(prev => [...prev, novaLista]);
    setListaAtivaId(novaLista.id);
    setItens([]);
    
    return novaLista.id;
  }, []);

  // Carregar listas salvas e lista ativa do localStorage ao montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Carregar listas salvas
        const listasSalvasData = localStorage.getItem(STORAGE_KEY_LISTAS);
        let listas: ListaSalva[] = [];
        if (listasSalvasData) {
          listas = JSON.parse(listasSalvasData);
          setListasSalvas(listas);
        }

        // Carregar lista ativa
        const listaAtivaIdData = localStorage.getItem(STORAGE_KEY_LISTA_ATIVA);
        if (listaAtivaIdData) {
          const listaId = JSON.parse(listaAtivaIdData);
          setListaAtivaId(listaId);
          
          // Carregar itens da lista ativa
          const listaAtiva = listas.find((l: ListaSalva) => l.id === listaId);
          
          if (listaAtiva) {
            setItens(listaAtiva.itens || []);
          } else {
            // Lista ativa não encontrada, criar uma nova
            criarNovaLista('Lista de Compras');
          }
        } else {
          // Se não há lista ativa, criar uma padrão
          if (listas.length === 0) {
            criarNovaLista('Lista de Compras');
          } else {
            // Usar a primeira lista disponível
            setListaAtivaId(listas[0].id);
            setItens(listas[0].itens || []);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar listas:', error);
        // Em caso de erro, criar uma lista padrão
        criarNovaLista('Lista de Compras');
      }
    }
  }, [criarNovaLista]);

  // Salvar listas no localStorage sempre que mudarem
  useEffect(() => {
    if (typeof window !== 'undefined' && listasSalvas.length > 0) {
      localStorage.setItem(STORAGE_KEY_LISTAS, JSON.stringify(listasSalvas));
    }
  }, [listasSalvas]);

  // Salvar lista ativa no localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && listaAtivaId) {
      localStorage.setItem(STORAGE_KEY_LISTA_ATIVA, JSON.stringify(listaAtivaId));
    }
  }, [listaAtivaId]);

  // Atualizar lista ativa quando itens mudarem
  useEffect(() => {
    if (typeof window !== 'undefined' && listaAtivaId) {
      const listaAtualizada = listasSalvas.map(lista => {
        if (lista.id === listaAtivaId) {
          return {
            ...lista,
            itens,
            total: itens.reduce((acc, item) => {
              const preco = item.emPromocao && item.precoPromocional 
                ? item.precoPromocional 
                : item.preco;
              return acc + preco * item.quantidade;
            }, 0),
          };
        }
        return lista;
      });
      setListasSalvas(listaAtualizada);
    }
  }, [itens, listaAtivaId]);

  const selecionarLista = (listaId: string) => {
    const lista = listasSalvas.find(l => l.id === listaId);
    if (lista) {
      setListaAtivaId(listaId);
      setItens(lista.itens || []);
    }
  };

  const salvarListaAtual = (nome: string) => {
    if (!listaAtivaId) {
      criarNovaLista(nome);
      return;
    }

    const listaAtualizada = listasSalvas.map(lista => {
      if (lista.id === listaAtivaId) {
        return {
          ...lista,
          nome,
          itens,
          total: itens.reduce((acc, item) => {
            const preco = item.emPromocao && item.precoPromocional 
              ? item.precoPromocional 
              : item.preco;
            return acc + preco * item.quantidade;
          }, 0),
        };
      }
      return lista;
    });
    setListasSalvas(listaAtualizada);
  };

  const deletarLista = (listaId: string) => {
    if (listasSalvas.length <= 1) {
      // Não permite deletar a última lista
      return;
    }

    const novasListas = listasSalvas.filter(l => l.id !== listaId);
    setListasSalvas(novasListas);

    // Se a lista deletada era a ativa, selecionar outra
    if (listaId === listaAtivaId) {
      if (novasListas.length > 0) {
        selecionarLista(novasListas[0].id);
      } else {
        criarNovaLista('Lista de Compras');
      }
    }
  };

  const adicionarItem = useCallback((item: ItemLista) => {
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

    // Registrar evento para IA (não bloqueante)
    if (typeof window !== 'undefined' && listaAtivaId) {
      const userId = localStorage.getItem('userId') || 'anonymous';
      const mercadoId = item.unidade?.mercado?.id || 'unknown';
      
      recordProductAddedToList(
        userId,
        mercadoId,
        item.id,
        listaAtivaId,
        item.quantidade || 1,
        item.preco
      ).catch(err => {
        console.error('Erro ao registrar evento:', err);
        // Não quebrar o fluxo
      });
    }
  }, [listaAtivaId]);

  const removerItem = useCallback((id: string) => {
    const itemRemovido = itens.find(i => i.id === id);
    
    setItens((prevItens) => prevItens.filter((item) => item.id !== id));

    // Registrar evento para IA (não bloqueante)
    if (typeof window !== 'undefined' && listaAtivaId && itemRemovido) {
      const userId = localStorage.getItem('userId') || 'anonymous';
      const mercadoId = itemRemovido.unidade?.mercado?.id || 'unknown';
      
      recordProductRemovedFromList(
        userId,
        mercadoId,
        itemRemovido.id,
        listaAtivaId
      ).catch(err => {
        console.error('Erro ao registrar evento:', err);
        // Não quebrar o fluxo
      });
    }
  }, [itens, listaAtivaId]);

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
        listaAtivaId,
        listasSalvas,
        adicionarItem,
        removerItem,
        atualizarQuantidade,
        limparLista,
        criarNovaLista,
        selecionarLista,
        salvarListaAtual,
        deletarLista,
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

