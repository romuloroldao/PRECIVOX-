/**
 * Modo Emergência — “jantar hoje” (Épico 7.3)
 * Até 5 itens, um mercado, prioriza rapidez e itens de refeição.
 */

import { prisma } from '@/lib/prisma';
import { EventCollector } from '@/lib/ai/event-collector';
import { calcularDespensaDigital, parseDespensaManual } from '@/lib/despensa-digital';
import { montarCestaProvavel } from '@/lib/cesta-provavel';

export const LIMITE_ITENS_EMERGENCIA = 5;

const TOKENS_JANTAR = [
  'arroz',
  'feijao',
  'feijão',
  'macarrao',
  'macarrão',
  'massa',
  'frango',
  'carne',
  'ovo',
  'ovos',
  'leite',
  'pao',
  'pão',
  'tomate',
  'cebola',
  'oleo',
  'óleo',
  'queijo',
  'iogurte',
  'salada',
  'legume',
  'batata',
  'tempero',
  'molho',
  'salsicha',
  'linguica',
  'linguiça',
];

export type ItemEmergenciaPlanejado = {
  produtoId: string;
  nome: string;
  motivo: string;
  prioridade: number;
};

function nomeCombinaJantar(nome: string, categoria?: string | null): boolean {
  const texto = `${nome} ${categoria ?? ''}`.toLowerCase();
  return TOKENS_JANTAR.some((t) => texto.includes(t));
}

function prioridadeNome(nome: string, categoria?: string | null): number {
  if (!nomeCombinaJantar(nome, categoria)) return 0;
  const texto = `${nome} ${categoria ?? ''}`.toLowerCase();
  if (/\barroz\b|\bfeij/.test(texto)) return 100;
  if (/\bfrango\b|\bcarne\b|\bovo/.test(texto)) return 90;
  if (/\bmacarr|massa|pao|pão/.test(texto)) return 85;
  if (/\btomate|cebola|oleo|óleo|salada|legume/.test(texto)) return 70;
  return 60;
}

export async function planejarModoEmergencia(
  userId: string,
  mercadoId: string,
  perfilPreci: unknown
): Promise<{
  itens: ItemEmergenciaPlanejado[];
  resumo: string;
  mercadoId: string;
}> {
  const manual = parseDespensaManual(perfilPreci);
  const map = new Map<string, ItemEmergenciaPlanejado>();

  const add = (produtoId: string, nome: string, motivo: string, prioridade: number) => {
    if (map.size >= LIMITE_ITENS_EMERGENCIA) return;
    const atual = map.get(produtoId);
    if (!atual || prioridade > atual.prioridade) {
      map.set(produtoId, { produtoId, nome, motivo, prioridade });
    }
  };

  const [despensa, cesta] = await Promise.all([
    calcularDespensaDigital(userId, mercadoId, manual),
    montarCestaProvavel(userId, mercadoId, 8),
  ]);

  for (const d of despensa.itens.filter((i) => i.status === 'acabando').slice(0, 2)) {
    add(d.produtoId, d.nome, 'Acabando — repor para o jantar', 110);
  }

  const cestaOrdenada = [...cesta.itens].sort(
    (a, b) => prioridadeNome(b.nome) - prioridadeNome(a.nome)
  );
  for (const c of cestaOrdenada) {
    if (prioridadeNome(c.nome) > 0) {
      add(c.produtoId, c.nome, 'Você costuma comprar para refeição', prioridadeNome(c.nome));
    }
  }

  if (map.size < LIMITE_ITENS_EMERGENCIA) {
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 14);
    const eventos = await EventCollector.getUserEvents(userId, mercadoId, inicio, fim);
    const recentes = new Map<string, number>();
    for (const ev of eventos) {
      if (ev.type !== 'produto_adicionado_lista') continue;
      const pid = (ev.metadata as { produtoId?: string }).produtoId;
      if (!pid || map.has(pid)) continue;
      recentes.set(pid, (recentes.get(pid) ?? 0) + 1);
    }
    const idsRecentes = [...recentes.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    if (idsRecentes.length > 0) {
      const produtos = await prisma.produtos.findMany({
        where: { id: { in: idsRecentes } },
        select: { id: true, nome: true, categoria: true },
      });
      for (const p of produtos) {
        if (nomeCombinaJantar(p.nome ?? '', p.categoria)) {
          add(p.id, p.nome ?? 'Produto', 'Adicionado recentemente às suas listas', 75);
        }
      }
    }
  }

  if (map.size < LIMITE_ITENS_EMERGENCIA) {
    const exclude = [...map.keys()];
    const estoqueWhere = {
      disponivel: true,
      quantidade: { gt: 0 },
      unidades: { mercadoId, ativa: true },
      ...(exclude.length > 0 ? { produtoId: { notIn: exclude } } : {}),
    };

    const candidatos = await prisma.produtos.findMany({
      where: {
        ativo: true,
        estoques: { some: estoqueWhere },
        OR: TOKENS_JANTAR.slice(0, 12).map((t) => ({
          nome: { contains: t, mode: 'insensitive' as const },
        })),
      },
      take: 40,
      select: {
        id: true,
        nome: true,
        categoria: true,
        estoques: {
          where: estoqueWhere,
          take: 1,
          orderBy: [{ emPromocao: 'desc' }, { preco: 'asc' }],
          select: { emPromocao: true, preco: true },
        },
      },
    });

    const ranked = candidatos
      .filter((p) => p.estoques.length > 0)
      .map((p) => ({
        p,
        score:
          prioridadeNome(p.nome ?? '', p.categoria) +
          (p.estoques[0]?.emPromocao ? 15 : 0),
      }))
      .sort((a, b) => b.score - a.score);

    for (const { p } of ranked) {
      if (map.size >= LIMITE_ITENS_EMERGENCIA) break;
      add(
        p.id,
        p.nome ?? 'Produto',
        p.estoques[0]?.emPromocao ? 'Em promo no seu mercado' : 'Essencial para jantar rápido',
        prioridadeNome(p.nome ?? '', p.categoria) + 10
      );
    }
  }

  const itens = [...map.values()]
    .sort((a, b) => b.prioridade - a.prioridade)
    .slice(0, LIMITE_ITENS_EMERGENCIA);

  const resumo =
    itens.length === 0
      ? 'Não encontramos itens para jantar neste mercado agora.'
      : itens.length < LIMITE_ITENS_EMERGENCIA
        ? `${itens.length} itens para jantar hoje — 1 mercado, compra rápida.`
        : `${LIMITE_ITENS_EMERGENCIA} itens para jantar hoje — 1 mercado, mínimo tempo.`;

  return { itens, resumo, mercadoId };
}

export function nomeListaModoEmergencia(): string {
  const h = new Date().getHours();
  const refeicao = h < 11 ? 'Café' : h < 15 ? 'Almoço' : 'Jantar';
  return `${refeicao} hoje · modo emergência`;
}
