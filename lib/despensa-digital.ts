/**
 * Despensa digital — ciclo de reposição inferido (Épico 7.1)
 */

import { prisma } from '@/lib/prisma';
import { EventCollector } from '@/lib/ai/event-collector';

export type DespensaStatus = 'ok' | 'atencao' | 'acabando';

export type DespensaItem = {
  produtoId: string;
  nome: string;
  cicloDias: number;
  diasDesdeUltimaCompra: number | null;
  diasRestantes: number | null;
  status: DespensaStatus;
  frequenciaLista: number;
  fonte: 'inferido' | 'manual';
};

export type DespensaManualEntry = {
  produtoId: string;
  nome: string;
  cicloDias: number;
  adicionadoEm: string;
};

function statusFromDiasRestantes(dias: number | null): DespensaStatus {
  if (dias == null) return 'ok';
  if (dias <= 0) return 'acabando';
  if (dias <= 3) return 'atencao';
  return 'ok';
}

export async function calcularDespensaDigital(
  userId: string,
  mercadoId?: string | null,
  manual: DespensaManualEntry[] = []
): Promise<{ itens: DespensaItem[]; resumo: string }> {
  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 120);

  // Sem mercado = despensa da casa (todos os hábitos). Com mercado = recorte (cesta/emergência).
  const eventos = mercadoId
    ? await EventCollector.getUserEvents(userId, mercadoId, inicio, fim)
    : await EventCollector.getUserEventsGlobal(userId, inicio, fim);

  const porProduto = new Map<string, { adds: Date[]; compras: Date[] }>();

  for (const ev of eventos) {
    const pid = (ev.metadata as { produtoId?: string }).produtoId;
    if (!pid) continue;
    if (!porProduto.has(pid)) porProduto.set(pid, { adds: [], compras: [] });
    const row = porProduto.get(pid)!;
    if (ev.type === 'produto_adicionado_lista') row.adds.push(new Date(ev.timestamp));
    if (['compra_confirmada', 'compra_realizada'].includes(ev.type)) {
      row.compras.push(new Date(ev.timestamp));
    }
  }

  const itens: DespensaItem[] = [];

  for (const [produtoId, data] of porProduto.entries()) {
    if (data.adds.length < 2 && data.compras.length < 1) continue;

    let cicloDias = 14;
    if (data.compras.length >= 2) {
      const ordenadas = [...data.compras].sort((a, b) => a.getTime() - b.getTime());
      const gaps: number[] = [];
      for (let i = 1; i < ordenadas.length; i++) {
        gaps.push((ordenadas[i].getTime() - ordenadas[i - 1].getTime()) / 86400000);
      }
      cicloDias = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) || 14;
    }
    cicloDias = Math.min(60, Math.max(3, cicloDias));

    const ultimaCompra =
      data.compras.length > 0
        ? new Date(Math.max(...data.compras.map((d) => d.getTime())))
        : null;
    const diasDesde = ultimaCompra
      ? Math.floor((Date.now() - ultimaCompra.getTime()) / 86400000)
      : null;
    const diasRestantes = diasDesde != null ? Math.max(0, cicloDias - diasDesde) : null;

    itens.push({
      produtoId,
      nome: 'Produto',
      cicloDias,
      diasDesdeUltimaCompra: diasDesde,
      diasRestantes,
      status: statusFromDiasRestantes(diasRestantes),
      frequenciaLista: data.adds.length,
      fonte: 'inferido',
    });
  }

  for (const m of manual) {
    if (porProduto.has(m.produtoId)) continue;
    itens.push({
      produtoId: m.produtoId,
      nome: m.nome,
      cicloDias: m.cicloDias,
      diasDesdeUltimaCompra: null,
      diasRestantes: m.cicloDias,
      status: 'ok',
      frequenciaLista: 0,
      fonte: 'manual',
    });
  }

  const ids = [...new Set(itens.map((i) => i.produtoId))];
  if (ids.length > 0) {
    const produtos = await prisma.produtos.findMany({
      where: { id: { in: ids } },
      select: { id: true, nome: true },
    });
    const nomes = new Map(produtos.map((p) => [p.id, p.nome ?? 'Produto']));
    for (const item of itens) {
      if (item.fonte === 'inferido') item.nome = nomes.get(item.produtoId) ?? item.nome;
    }
  }

  itens.sort((a, b) => {
    const order = { acabando: 0, atencao: 1, ok: 2 };
    return order[a.status] - order[b.status];
  });

  const acabando = itens.filter((i) => i.status === 'acabando').length;
  const atencao = itens.filter((i) => i.status === 'atencao').length;
  let resumo = `${itens.length} itens na sua despensa digital.`;
  if (acabando > 0) resumo = `${acabando} item(ns) provavelmente acabando — hora de repor.`;
  else if (atencao > 0) resumo = `${atencao} item(ns) pedem atenção nos próximos dias.`;

  return { itens, resumo };
}

export function parseDespensaManual(perfilPreci: unknown): DespensaManualEntry[] {
  if (!perfilPreci || typeof perfilPreci !== 'object') return [];
  const d = (perfilPreci as { despensaManual?: DespensaManualEntry[] }).despensaManual;
  return Array.isArray(d) ? d : [];
}
