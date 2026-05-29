import type { ItemLista } from '@/app/context/ListaContext';
import { haversineKm } from '@/lib/geo';

export interface RotaPasso {
  ordem: number;
  mercadoId: string;
  mercadoNome: string;
  itens: ItemLista[];
  subtotal: number;
  qtdLinhas: number;
}

export type RotaOtimizada = {
  passos: RotaPasso[];
  distanciaTotalKm: number | null;
  metodo: 'valor' | 'geo';
};

function subtotalItem(item: ItemLista): number {
  const p = item.emPromocao && item.precoPromocional ? item.precoPromocional : item.preco;
  return p * item.quantidade;
}

function buildPassosFromItens(itens: ItemLista[]): RotaPasso[] {
  const map = new Map<string, { nome: string; itens: ItemLista[] }>();

  for (const item of itens) {
    const id = item.unidade.mercado.id;
    if (!map.has(id)) {
      map.set(id, { nome: item.unidade.mercado.nome, itens: [] });
    }
    map.get(id)!.itens.push(item);
  }

  const passos: RotaPasso[] = [];
  for (const [mercadoId, data] of map.entries()) {
    const subtotal = data.itens.reduce((acc, i) => acc + subtotalItem(i), 0);
    passos.push({
      ordem: 0,
      mercadoId,
      mercadoNome: data.nome,
      itens: data.itens,
      subtotal,
      qtdLinhas: data.itens.length,
    });
  }

  passos.sort((a, b) => b.subtotal - a.subtotal);
  passos.forEach((p, i) => {
    p.ordem = i + 1;
  });

  return passos;
}

/** Nearest-neighbor a partir do mercado com maior subtotal. */
function ordenarPorProximidade(
  passos: RotaPasso[],
  coords: Map<string, { lat: number; lon: number }>
): { passos: RotaPasso[]; distanciaTotalKm: number } {
  if (passos.length <= 1) {
    return { passos, distanciaTotalKm: 0 };
  }

  const restantes = [...passos];
  const ordenados: RotaPasso[] = [];

  restantes.sort((a, b) => b.subtotal - a.subtotal);
  let atual = restantes.shift()!;
  ordenados.push(atual);

  let kmTotal = 0;
  while (restantes.length > 0) {
    const cAtual = coords.get(atual.mercadoId);
    if (!cAtual) break;

    let melhorIdx = 0;
    let melhorKm = Infinity;
    for (let i = 0; i < restantes.length; i++) {
      const c = coords.get(restantes[i].mercadoId);
      if (!c) continue;
      const d = haversineKm(cAtual.lat, cAtual.lon, c.lat, c.lon);
      if (d < melhorKm) {
        melhorKm = d;
        melhorIdx = i;
      }
    }

    if (melhorKm === Infinity) break;
    kmTotal += melhorKm;
    atual = restantes.splice(melhorIdx, 1)[0];
    ordenados.push(atual);
  }

  if (ordenados.length < passos.length) {
    ordenados.push(...restantes);
  }

  ordenados.forEach((p, i) => {
    p.ordem = i + 1;
  });

  return { passos: ordenados, distanciaTotalKm: Math.round(kmTotal * 10) / 10 };
}

/**
 * Agrupa itens por mercado e ordena a rota.
 * Com coordenadas de todas as lojas, usa nearest-neighbor (menos deslocamento).
 */
export function computeShoppingRoute(itens: ItemLista[]): RotaPasso[] {
  return buildPassosFromItens(itens);
}

export function computeShoppingRouteOtimizada(
  itens: ItemLista[],
  coords?: Map<string, { lat: number; lon: number }>
): RotaOtimizada {
  const passosBase = buildPassosFromItens(itens);

  if (!coords || passosBase.length <= 1) {
    return { passos: passosBase, distanciaTotalKm: null, metodo: 'valor' };
  }

  const todosComCoords = passosBase.every((p) => coords.has(p.mercadoId));
  if (!todosComCoords) {
    return { passos: passosBase, distanciaTotalKm: null, metodo: 'valor' };
  }

  const { passos, distanciaTotalKm } = ordenarPorProximidade(passosBase, coords);
  return { passos, distanciaTotalKm, metodo: 'geo' };
}

export function dicaDeslocamento(numMercados: number, km?: number | null): string {
  if (numMercados <= 1) {
    return 'Tudo em um só mercado: rota direta.';
  }
  if (km != null && km > 0) {
    return `Rota otimizada por proximidade (~${km} km entre ${numMercados} lojas). Siga a ordem para menos deslocamento.`;
  }
  if (numMercados === 2) {
    return 'Dois mercados: siga a ordem sugerida para fazer menos voltas.';
  }
  return `${numMercados} mercados na lista: a ordem prioriza valor e proximidade quando há coordenadas.`;
}
