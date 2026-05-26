/**
 * Cesta provável — oferta de demanda (Sprint 3)
 */

import { prisma } from '@/lib/prisma';
import { EventCollector } from '@/lib/ai/event-collector';
import { calcularIntentScore } from '@/lib/ai/intent-score-engine';

export type ItemCestaProvavel = {
  produtoId: string;
  nome: string;
  frequencia: number;
  diasDesdeUltimaCompra: number | null;
  motivo: string;
};

export async function montarCestaProvavel(
  userId: string,
  mercadoId: string,
  limite = 12
): Promise<{
  itens: ItemCestaProvavel[];
  intentScore: number;
  mensagem: string;
  economiaEstimada?: number;
}> {
  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 60);

  const eventos = await EventCollector.getUserEvents(userId, mercadoId, inicio, fim);
  const intent = calcularIntentScore(eventos, 72);

  const freq = new Map<string, { count: number; lastAdd: Date; lastBuy: Date | null }>();

  for (const ev of eventos) {
    const pid = (ev.metadata as { produtoId?: string }).produtoId;
    if (!pid) continue;
    if (!freq.has(pid)) freq.set(pid, { count: 0, lastAdd: ev.timestamp, lastBuy: null });
    const row = freq.get(pid)!;
    if (ev.type === 'produto_adicionado_lista') {
      row.count++;
      if (new Date(ev.timestamp) > row.lastAdd) row.lastAdd = new Date(ev.timestamp);
    }
    if (['compra_confirmada', 'compra_realizada'].includes(ev.type)) {
      if (!row.lastBuy || new Date(ev.timestamp) > row.lastBuy) {
        row.lastBuy = new Date(ev.timestamp);
      }
    }
  }

  const candidatos = [...freq.entries()]
    .filter(([, v]) => v.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limite * 2);

  const produtoIds = candidatos.map(([id]) => id);
  const produtos = await prisma.produtos.findMany({
    where: { id: { in: produtoIds } },
    select: { id: true, nome: true },
  });
  const nomeMap = new Map(produtos.map((p) => [p.id, p.nome ?? 'Produto']));

  const agora = Date.now();
  const itens: ItemCestaProvavel[] = candidatos.slice(0, limite).map(([produtoId, v]) => {
    const diasDesde =
      v.lastBuy != null ? Math.floor((agora - v.lastBuy.getTime()) / (86400000)) : null;
    let motivo = 'Você costuma colocar na lista';
    if (diasDesde != null && diasDesde >= 7) {
      motivo = `Há ~${diasDesde} dias desde a última compra`;
    } else if (v.count >= 4) {
      motivo = 'Item frequente no seu padrão';
    }
    return {
      produtoId,
      nome: nomeMap.get(produtoId) ?? 'Produto',
      frequencia: v.count,
      diasDesdeUltimaCompra: diasDesde,
      motivo,
    };
  });

  let mensagem = 'Montamos uma cesta provável com base no seu histórico no PRECIVOX.';
  if (intent.score >= 65) {
    mensagem = 'Alta chance de compra em breve — sua cesta provável está pronta para revisar.';
  }

  return { itens, intentScore: intent.score, mensagem };
}

export function inferirDiaMercado(
  horariosPico: { diaSemana: number; hora: number; frequencia: number }[]
): { diaSemana: number; label: string } | null {
  if (!horariosPico.length) return null;
  const porDia = new Map<number, number>();
  for (const h of horariosPico) {
    porDia.set(h.diaSemana, (porDia.get(h.diaSemana) ?? 0) + h.frequencia);
  }
  let best = 0;
  let max = 0;
  porDia.forEach((v, d) => {
    if (v > max) {
      max = v;
      best = d;
    }
  });
  const labels = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  return { diaSemana: best, label: labels[best] ?? 'seu dia' };
}
