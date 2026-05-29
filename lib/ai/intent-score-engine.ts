/**
 * Intent Score — heurística com decay temporal (Sprint 2)
 */

import type { UserEvent } from '@/lib/ai/types';

const PESOS: Partial<Record<UserEvent['type'], number>> = {
  lista_criada: 18,
  produto_adicionado_lista: 8,
  produto_buscado: 5,
  produto_visualizado: 2,
  promocao_visualizada: 4,
  produto_substituicao_aceita: 6,
  rota_consolidacao_lista: 10,
  checkin_mercado: 15,
  compra_confirmada: -30,
  compra_parcial: -10,
  compra_nao_realizada: -5,
};

/** Pesos por tipo de evento — reutilizado no heatmap de intenção (gestor). */
export const INTENT_EVENT_PESOS: Partial<Record<UserEvent['type'], number>> = PESOS;

export const INTENT_EVENT_TYPES = Object.keys(PESOS) as UserEvent['type'][];

const LAMBDA = 0.08; // decay por hora

export interface IntentScoreResult {
  score: number;
  confianca: number;
  fatores: string[];
  janelaHoras: number;
  proximaCompraEstimada?: string;
}

export function calcularIntentScore(
  eventos: UserEvent[],
  janelaHoras = 72
): IntentScoreResult {
  const agora = Date.now();
  const fatores: string[] = [];
  let raw = 0;

  for (const ev of eventos) {
    const peso = PESOS[ev.type];
    if (peso == null) continue;
    const horas = (agora - new Date(ev.timestamp).getTime()) / (1000 * 60 * 60);
    if (horas > janelaHoras * 2) continue;
    const contrib = peso * Math.exp(-LAMBDA * horas);
    raw += contrib;
    if (contrib > 3 && fatores.length < 5) {
      fatores.push(descricaoFator(ev.type));
    }
  }

  const score = Math.min(100, Math.max(0, Math.round(raw)));
  const confianca = Math.min(100, eventos.length * 5);

  let proximaCompraEstimada: string | undefined;
  const compras = eventos.filter((e) =>
    ['compra_confirmada', 'compra_realizada'].includes(e.type)
  );
  if (compras.length >= 2) {
    const ordenadas = [...compras].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const diff =
      (new Date(ordenadas[0].timestamp).getTime() -
        new Date(ordenadas[1].timestamp).getTime()) /
      (1000 * 60 * 60 * 24);
    if (diff > 0 && diff < 30) {
      const prox = new Date(ordenadas[0].timestamp);
      prox.setDate(prox.getDate() + Math.round(diff));
      proximaCompraEstimada = prox.toISOString();
    }
  }

  return { score, confianca, fatores, janelaHoras, proximaCompraEstimada };
}

function descricaoFator(type: UserEvent['type']): string {
  const map: Partial<Record<UserEvent['type'], string>> = {
    lista_criada: 'Lista ativa recentemente',
    produto_adicionado_lista: 'Itens sendo montados na lista',
    produto_buscado: 'Buscas frequentes',
    checkin_mercado: 'Check-in no mercado',
    rota_consolidacao_lista: 'Otimização de rota considerada',
  };
  return map[type] ?? type;
}
