import type { ListaSalva } from '@/app/context/ListaContext';

export interface ListSummary {
  id: string;
  name: string;
  itemsCount: number;
  totalSavings: number;
  updatedAt: string;
  archived: boolean;
}

/** Listas salvas no navegador (ListaContext / localStorage). */
export function listasSalvasToSummaries(listas: ListaSalva[]): ListSummary[] {
  return listas.map((l) => ({
    id: l.id,
    name: l.nome,
    itemsCount: l.itens.reduce((sum, i) => sum + i.quantidade, 0),
    totalSavings: Math.round(l.total * 100),
    updatedAt: l.criadaEm,
    archived: false,
  }));
}

/** Une listas do banco com listas locais que ainda não foram sincronizadas. */
export function mergeListSummaries(
  apiLists: ListSummary[],
  localLists: ListSummary[]
): ListSummary[] {
  const apiIds = new Set(apiLists.map((l) => l.id));
  const localsOnly = localLists.filter((l) => !apiIds.has(l.id));
  return [...apiLists, ...localsOnly].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function isListaLocal(id: string): boolean {
  return id.startsWith('lista-');
}
