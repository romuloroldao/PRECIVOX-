'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { recordProductAddedToList, recordProductRemovedFromList } from '@/lib/events/frontend-events';

export interface ItemLista {
  id: string;
  /** id em `produtos` (catálogo); usado em métricas de conversão */
  produtoCatalogoId?: string;
  estoqueId: string;
  nome: string;
  preco: number;
  precoPromocional?: number;
  emPromocao: boolean;
  quantidade: number;
  imagem?: string;
  imagemThumb?: string;
  imagemStatus?: string;
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
  restaurarItem: (item: ItemLista) => void;
  removerItem: (id: string) => void;
  aplicarTrocaRota: (removerIds: string[], novosItens: ItemLista[]) => void;
  restaurarItens: (snapshot: ItemLista[]) => void;
  atualizarQuantidade: (id: string, quantidade: number) => void;
  limparLista: () => void;
  criarNovaLista: (nome: string) => string;
  selecionarLista: (listaId: string) => void;
  salvarListaAtual: (nome: string) => void;
  deletarLista: (listaId: string) => void;
  total: number;
  totalItens: number;
  ultimoItemAdicionado: ItemLista | null;
  limparUltimoItem: () => void;
}

const ListaContext = createContext<ListaContextType | undefined>(undefined);

const STORAGE_KEY_LISTAS = 'precivox_listas_salvas';
const STORAGE_KEY_LISTA_ATIVA = 'precivox_lista_ativa_id';

function calcularTotal(itens: ItemLista[]) {
  return itens.reduce((acc, item) => {
    const preco = item.emPromocao && item.precoPromocional ? item.precoPromocional : item.preco;
    return acc + preco * item.quantidade;
  }, 0);
}

export function ListaProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemLista[]>([]);
  const [listaAtivaId, setListaAtivaId] = useState<string | null>(null);
  const [listasSalvas, setListasSalvas] = useState<ListaSalva[]>([]);
  const [ultimoItemAdicionado, setUltimoItemAdicionado] = useState<ItemLista | null>(null);

  const limparUltimoItem = useCallback(() => setUltimoItemAdicionado(null), []);

  const criarNovaLista = useCallback((nome: string): string => {
    const novaLista: ListaSalva = {
      id: `lista-${Date.now()}`,
      nome,
      criadaEm: new Date().toISOString(),
      itens: [],
      total: 0,
    };

    setListasSalvas((prev) => [...prev, novaLista]);
    setListaAtivaId(novaLista.id);
    setItens([]);

    return novaLista.id;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const listasSalvasData = localStorage.getItem(STORAGE_KEY_LISTAS);
      let listas: ListaSalva[] = [];
      if (listasSalvasData) {
        listas = JSON.parse(listasSalvasData);
        setListasSalvas(listas);
      }

      const listaAtivaIdData = localStorage.getItem(STORAGE_KEY_LISTA_ATIVA);
      if (listaAtivaIdData) {
        const listaId = JSON.parse(listaAtivaIdData);
        setListaAtivaId(listaId);
        const listaAtiva = listas.find((l) => l.id === listaId);
        if (listaAtiva) {
          setItens(listaAtiva.itens || []);
        } else {
          criarNovaLista('Lista de Compras');
        }
      } else if (listas.length === 0) {
        criarNovaLista('Lista de Compras');
      } else {
        setListaAtivaId(listas[0].id);
        setItens(listas[0].itens || []);
      }
    } catch (error) {
      console.error('Erro ao carregar listas:', error);
      criarNovaLista('Lista de Compras');
    }
  }, [criarNovaLista]);

  useEffect(() => {
    if (typeof window !== 'undefined' && listasSalvas.length > 0) {
      localStorage.setItem(STORAGE_KEY_LISTAS, JSON.stringify(listasSalvas));
    }
  }, [listasSalvas]);

  useEffect(() => {
    if (typeof window !== 'undefined' && listaAtivaId) {
      localStorage.setItem(STORAGE_KEY_LISTA_ATIVA, JSON.stringify(listaAtivaId));
    }
  }, [listaAtivaId]);

  useEffect(() => {
    if (!listaAtivaId) return;
    setListasSalvas((prev) =>
      prev.map((lista) =>
        lista.id === listaAtivaId
          ? { ...lista, itens, total: calcularTotal(itens) }
          : lista
      )
    );
  }, [itens, listaAtivaId]);

  const selecionarLista = useCallback((listaId: string) => {
    const lista = listasSalvas.find((l) => l.id === listaId);
    if (lista) {
      setListaAtivaId(listaId);
      setItens(lista.itens || []);
    }
  }, [listasSalvas]);

  const salvarListaAtual = useCallback(
    (nome: string) => {
      if (!listaAtivaId) {
        criarNovaLista(nome);
        return;
      }
      setListasSalvas((prev) =>
        prev.map((lista) =>
          lista.id === listaAtivaId
            ? { ...lista, nome, itens, total: calcularTotal(itens) }
            : lista
        )
      );
    },
    [listaAtivaId, itens, criarNovaLista]
  );

  const deletarLista = useCallback(
    (listaId: string) => {
      setListasSalvas((prev) => {
        if (prev.length <= 1) return prev;
        const novasListas = prev.filter((l) => l.id !== listaId);
        if (listaId === listaAtivaId && novasListas.length > 0) {
          const proxima = novasListas[0];
          setListaAtivaId(proxima.id);
          setItens(proxima.itens || []);
        }
        return novasListas;
      });
    },
    [listaAtivaId]
  );

  const adicionarItem = useCallback(
    (item: ItemLista) => {
      const qtd = item.quantidade && item.quantidade > 0 ? item.quantidade : 1;
      setItens((prevItens) => {
        const itemExistente = prevItens.find((i) => i.id === item.id);
        if (itemExistente) {
          return prevItens.map((i) =>
            i.id === item.id ? { ...i, quantidade: i.quantidade + qtd } : i
          );
        }
        return [...prevItens, { ...item, quantidade: qtd }];
      });
      setUltimoItemAdicionado({ ...item, quantidade: qtd });

      if (typeof window !== 'undefined' && listaAtivaId) {
        const userId = localStorage.getItem('userId') || 'anonymous';
        const mercadoId = item.unidade?.mercado?.id || 'unknown';
        recordProductAddedToList(
          userId,
          mercadoId,
          item.id,
          listaAtivaId,
          item.quantidade || 1,
          item.preco,
          item.produtoCatalogoId
        ).catch((err) => console.error('Erro ao registrar evento:', err));
      }
    },
    [listaAtivaId]
  );

  const aplicarTrocaRota = useCallback((removerIds: string[], novosItens: ItemLista[]) => {
    setItens((prev) => {
      const rest = prev.filter((i) => !removerIds.includes(i.id));
      return [...rest, ...novosItens];
    });
  }, []);

  const restaurarItens = useCallback((snapshot: ItemLista[]) => {
    setItens(snapshot.map((i) => ({ ...i })));
  }, []);

  const restaurarItem = useCallback((item: ItemLista) => {
    setItens((prevItens) => {
      if (prevItens.some((i) => i.id === item.id)) {
        return prevItens.map((i) =>
          i.id === item.id ? { ...item, quantidade: item.quantidade } : i
        );
      }
      return [...prevItens, { ...item }];
    });
  }, []);

  const removerItem = useCallback(
    (id: string) => {
      setItens((prevItens) => {
        const itemRemovido = prevItens.find((i) => i.id === id);
        if (typeof window !== 'undefined' && listaAtivaId && itemRemovido) {
          const userId = localStorage.getItem('userId') || 'anonymous';
          const mercadoId = itemRemovido.unidade?.mercado?.id || 'unknown';
          recordProductRemovedFromList(
            userId,
            mercadoId,
            itemRemovido.id,
            listaAtivaId,
            itemRemovido.produtoCatalogoId
          ).catch((err) => console.error('Erro ao registrar evento:', err));
        }
        return prevItens.filter((item) => item.id !== id);
      });
    },
    [listaAtivaId]
  );

  const atualizarQuantidade = useCallback(
    (id: string, quantidade: number) => {
      if (quantidade <= 0) {
        removerItem(id);
        return;
      }
      setItens((prevItens) =>
        prevItens.map((item) => (item.id === id ? { ...item, quantidade } : item))
      );
    },
    [removerItem]
  );

  const limparLista = useCallback(() => {
    setItens([]);
  }, []);

  const total = useMemo(() => calcularTotal(itens), [itens]);
  const totalItens = useMemo(
    () => itens.reduce((acc, item) => acc + item.quantidade, 0),
    [itens]
  );

  const value = useMemo(
    () => ({
      itens,
      listaAtivaId,
      listasSalvas,
      adicionarItem,
      restaurarItem,
      removerItem,
      aplicarTrocaRota,
      restaurarItens,
      atualizarQuantidade,
      limparLista,
      criarNovaLista,
      selecionarLista,
      salvarListaAtual,
      deletarLista,
      total,
      totalItens,
      ultimoItemAdicionado,
      limparUltimoItem,
    }),
    [
      itens,
      listaAtivaId,
      listasSalvas,
      adicionarItem,
      restaurarItem,
      removerItem,
      aplicarTrocaRota,
      restaurarItens,
      atualizarQuantidade,
      limparLista,
      criarNovaLista,
      selecionarLista,
      salvarListaAtual,
      deletarLista,
      total,
      totalItens,
      ultimoItemAdicionado,
      limparUltimoItem,
    ]
  );

  return <ListaContext.Provider value={value}>{children}</ListaContext.Provider>;
}

export function useLista() {
  const context = useContext(ListaContext);
  if (context === undefined) {
    throw new Error('useLista deve ser usado dentro de ListaProvider');
  }
  return context;
}
