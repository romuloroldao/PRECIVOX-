/**
 * Ativar lista local ou remota como compra ativa (Fase 2).
 * Domínio: ListaContext + GET /api/lists/[id].
 */

import type { ItemLista } from '@/app/context/ListaContext';
import { isListaLocal } from '@/lib/listas-merge';

export type ApiListProduct = {
  id: string;
  name: string;
  quantity: number;
  bestPrice: number;
  avgPrice: number;
  savings: number;
  bestMarket?: { id: string; name: string; distance?: number };
};

export type ApiListDetail = {
  id: string;
  name: string;
  products: ApiListProduct[];
  totalSavings: number;
  updatedAt: string;
};

export function apiProductToItemLista(p: ApiListProduct): ItemLista {
  const mercadoId = p.bestMarket?.id || 'unknown';
  const mercadoNome = p.bestMarket?.name || 'Mercado';
  const preco = Number(p.bestPrice || p.avgPrice || 0);

  return {
    id: p.id,
    produtoCatalogoId: p.id,
    estoqueId: `remote-${p.id}`,
    nome: p.name,
    preco,
    emPromocao: false,
    quantidade: p.quantity > 0 ? p.quantity : 1,
    unidade: {
      id: mercadoId,
      nome: mercadoNome,
      mercado: { id: mercadoId, nome: mercadoNome },
    },
  };
}

export async function fetchListaRemota(listId: string): Promise<ApiListDetail | null> {
  const res = await fetch(`/api/lists/${encodeURIComponent(listId)}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok || !json.success || !json.data) return null;
  return json.data as ApiListDetail;
}

export { isListaLocal };
