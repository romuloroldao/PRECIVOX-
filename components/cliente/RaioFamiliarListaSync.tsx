'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useLista, type ItemLista } from '@/app/context/ListaContext';
import { useRaioFamiliar } from '@/app/hooks/useRaioFamiliar';
import type { ItemListaCompartilhada } from '@/lib/raio-familiar';

const STORAGE_SYNC_TS = 'precivox_raio_lista_sync_ts';

function toSnapshotItem(item: ItemLista): ItemListaCompartilhada {
  return {
    id: item.id,
    produtoCatalogoId: item.produtoCatalogoId,
    estoqueId: item.estoqueId,
    nome: item.nome,
    preco: item.preco,
    precoPromocional: item.precoPromocional,
    emPromocao: item.emPromocao,
    quantidade: item.quantidade,
    imagem: item.imagem,
    categoria: item.categoria,
    marca: item.marca,
    unidade: item.unidade,
  };
}

function fromSnapshotItem(item: ItemListaCompartilhada): ItemLista {
  return {
    id: item.id,
    produtoCatalogoId: item.produtoCatalogoId,
    estoqueId: item.estoqueId,
    nome: item.nome,
    preco: item.preco,
    precoPromocional: item.precoPromocional,
    emPromocao: item.emPromocao,
    quantidade: item.quantidade,
    imagem: item.imagem,
    categoria: item.categoria,
    marca: item.marca,
    unidade: item.unidade,
  };
}

/** Sincroniza lista local com o raio familiar (pull + push com debounce). */
export function RaioFamiliarListaSync() {
  const { status } = useSession();
  const { itens, restaurarItens } = useLista();
  const { data, recarregar } = useRaioFamiliar(status === 'authenticated');
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aplicouRemoto = useRef(false);

  useEffect(() => {
    if (!data?.ativo || !data.circle?.preferencias.compartilharListas) return;
    const remoto = data.circle.listaCompartilhada;
    if (!remoto?.itens?.length || aplicouRemoto.current) return;

    const localTs = localStorage.getItem(STORAGE_SYNC_TS);
    const remotoTs = remoto.atualizadoEm;
    if (!localTs || new Date(remotoTs) > new Date(localTs)) {
      const parsed = remoto.itens as ItemListaCompartilhada[];
      if (parsed.length > 0) {
        restaurarItens(parsed.map(fromSnapshotItem));
        localStorage.setItem(STORAGE_SYNC_TS, remotoTs);
        aplicouRemoto.current = true;
      }
    }
  }, [data, restaurarItens]);

  useEffect(() => {
    if (!data?.ativo || !data.circle?.preferencias.compartilharListas) return;

    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch('/api/cliente/raio-familiar', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              acao: 'sync-lista',
              itens: itens.map(toSnapshotItem),
            }),
          });
          const json = await res.json();
          if (json.success?.data?.listaCompartilhada?.atualizadoEm) {
            localStorage.setItem(
              STORAGE_SYNC_TS,
              json.data.listaCompartilhada.atualizadoEm
            );
          }
          void recarregar();
        } catch {
          /* ignore */
        }
      })();
    }, 2500);

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [itens, data, recarregar]);

  return null;
}
