import type { UserEvent } from '@/lib/ai/types';

const GAP_CESTA_MS = 4 * 60 * 60 * 1000;
const MIN_ITENS_CESTA = 2;

export type CoocorrenciaMap = Map<string, Map<string, number>>;

function bump(map: CoocorrenciaMap, a: string, b: string): void {
  if (!map.has(a)) map.set(a, new Map());
  const row = map.get(a)!;
  row.set(b, (row.get(b) ?? 0) + 1);
}

function produtoIdDeEvento(ev: UserEvent): string | null {
  const pid = (ev.metadata as { produtoId?: string }).produtoId;
  return pid ? String(pid) : null;
}

/**
 * Agrupa eventos em “cestas” (sessões de lista/compra) para market-basket leve.
 */
export function extrairCestasDeEventos(eventos: UserEvent[]): string[][] {
  const sorted = [...eventos].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const cestas: string[][] = [];
  let atual: string[] = [];
  let ultimoTs = 0;

  const fechar = () => {
    if (atual.length >= MIN_ITENS_CESTA) cestas.push([...atual]);
    atual = [];
    ultimoTs = 0;
  };

  for (const ev of sorted) {
    const ts = new Date(ev.timestamp).getTime();
    if (ev.type === 'lista_criada') fechar();

    if (
      !['produto_adicionado_lista', 'compra_confirmada', 'compra_realizada'].includes(ev.type)
    ) {
      continue;
    }

    const pid = produtoIdDeEvento(ev);
    if (!pid) continue;

    if (ultimoTs && ts - ultimoTs > GAP_CESTA_MS) fechar();
    if (!atual.includes(pid)) atual.push(pid);
    ultimoTs = ts;
  }
  fechar();
  return cestas;
}

export function buildCoocorrenciaFromCestas(cestas: string[][]): CoocorrenciaMap {
  const map: CoocorrenciaMap = new Map();
  for (const cesta of cestas) {
    for (let i = 0; i < cesta.length; i++) {
      for (let j = i + 1; j < cesta.length; j++) {
        bump(map, cesta[i], cesta[j]);
        bump(map, cesta[j], cesta[i]);
      }
    }
  }
  return map;
}

export function sugerirPorCoocorrencia(
  map: CoocorrenciaMap,
  produtosNaLista: Set<string>,
  limite: number
): Array<{ produtoId: string; score: number }> {
  const scores = new Map<string, number>();

  for (const pid of produtosNaLista) {
    const vizinhos = map.get(pid);
    if (!vizinhos) continue;
    for (const [outro, count] of vizinhos) {
      if (produtosNaLista.has(outro)) continue;
      scores.set(outro, (scores.get(outro) ?? 0) + count);
    }
  }

  return [...scores.entries()]
    .map(([produtoId, score]) => ({ produtoId, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limite);
}
