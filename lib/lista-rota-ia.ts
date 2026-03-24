import type { ItemLista } from '@/app/context/ListaContext';

export interface RotaPasso {
  ordem: number;
  mercadoId: string;
  mercadoNome: string;
  itens: ItemLista[];
  subtotal: number;
  /** Quantidade de produtos distintos */
  qtdLinhas: number;
}

/**
 * Agrupa itens por mercado e ordena a rota para minimizar idas e voltas:
 * visita primeiro onde o valor acumulado é maior (menos risco de esquecer itens caros),
 * depois os demais em ordem decrescente de subtotal.
 */
export function computeShoppingRoute(itens: ItemLista[]): RotaPasso[] {
  const map = new Map<string, { nome: string; itens: ItemLista[] }>();

  for (const item of itens) {
    const id = item.unidade.mercado.id;
    if (!map.has(id)) {
      map.set(id, { nome: item.unidade.mercado.nome, itens: [] });
    }
    map.get(id)!.itens.push(item);
  }

  const passos: RotaPasso[] = [];
  let ordem = 1;

  for (const [mercadoId, data] of map.entries()) {
    const subtotal = data.itens.reduce((acc, i) => {
      const p = i.emPromocao && i.precoPromocional ? i.precoPromocional : i.preco;
      return acc + p * i.quantidade;
    }, 0);

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

export function dicaDeslocamento(numMercados: number): string {
  if (numMercados <= 1) {
    return 'Tudo em um só mercado: rota direta.';
  }
  if (numMercados === 2) {
    return 'Dois mercados: siga a ordem sugerida para fazer menos voltas.';
  }
  return `${numMercados} mercados na lista: a ordem abaixo prioriza onde você concentra mais valor.`;
}
