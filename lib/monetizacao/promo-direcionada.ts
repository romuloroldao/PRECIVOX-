/**
 * Promo direcionada — segmentação por intenção/churn/cesta (Épico 17)
 */

import { calcularIntentScore } from '@/lib/ai/intent-score-engine';
import { EventCollector } from '@/lib/ai/event-collector';
import { calcularChurnRisk } from '@/lib/ml-leve/churn-scorer';
import { prisma } from '@/lib/prisma';
import { obterMonetizacaoMercado, salvarMonetizacaoMercado } from './config';
import type { PromoDirecionada, PromoSegmento } from './types';

export type PromoCliente = {
  id: string;
  titulo: string;
  descontoPct: number;
  produtoId?: string;
  produtoNome?: string;
  categoria?: string;
  validoAte: string;
  motivo: string;
};

function novoId(): string {
  return `promo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listarPromosGestor(mercadoId: string): Promise<PromoDirecionada[]> {
  const m = await obterMonetizacaoMercado(mercadoId);
  return m.promosDirecionadas.sort(
    (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
  );
}

export async function criarPromoDirecionada(
  mercadoId: string,
  input: Omit<PromoDirecionada, 'id' | 'criadoEm' | 'ativo'> & { ativo?: boolean }
): Promise<PromoDirecionada> {
  const m = await obterMonetizacaoMercado(mercadoId);
  const promo: PromoDirecionada = {
    id: novoId(),
    ativo: input.ativo ?? true,
    titulo: input.titulo.slice(0, 80),
    produtoId: input.produtoId,
    categoria: input.categoria?.slice(0, 80),
    descontoPct: Math.min(50, Math.max(3, input.descontoPct)),
    segmento: input.segmento,
    validoAte: input.validoAte,
    criadoEm: new Date().toISOString(),
  };
  await salvarMonetizacaoMercado(mercadoId, {
    promosDirecionadas: [promo, ...m.promosDirecionadas].slice(0, 20),
  });
  return promo;
}

export async function togglePromoDirecionada(
  mercadoId: string,
  promoId: string,
  ativo: boolean
): Promise<PromoDirecionada | null> {
  const m = await obterMonetizacaoMercado(mercadoId);
  let found: PromoDirecionada | null = null;
  const promos = m.promosDirecionadas.map((p) => {
    if (p.id !== promoId) return p;
    found = { ...p, ativo };
    return found;
  });
  if (!found) return null;
  await salvarMonetizacaoMercado(mercadoId, { promosDirecionadas: promos });
  return found;
}

async function usuarioNoSegmento(
  userId: string,
  mercadoId: string,
  segmento: PromoSegmento
): Promise<boolean> {
  if (segmento === 'todos') return true;

  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 30);

  const eventos = await EventCollector.getUserEvents(userId, mercadoId, inicio, fim);

  if (segmento === 'intent_alta') {
    const intent = calcularIntentScore(eventos);
    return intent.score >= 55;
  }

  if (segmento === 'churn_risco') {
    const churn = calcularChurnRisk(eventos);
    return churn.nivel === 'alto' || churn.nivel === 'medio';
  }

  if (segmento === 'cesta_semana') {
    const ha7 = new Date();
    ha7.setDate(ha7.getDate() - 7);
    return eventos.some(
      (e) => e.type === 'produto_adicionado_lista' && new Date(e.timestamp) >= ha7
    );
  }

  return false;
}

export async function promosParaUsuario(
  userId: string,
  mercadoId: string
): Promise<PromoCliente[]> {
  const m = await obterMonetizacaoMercado(mercadoId);
  const agora = new Date();
  const ativas = m.promosDirecionadas.filter(
    (p) => p.ativo && new Date(p.validoAte) > agora
  );

  const out: PromoCliente[] = [];

  for (const promo of ativas.slice(0, 10)) {
    const ok = await usuarioNoSegmento(userId, mercadoId, promo.segmento);
    if (!ok) continue;

    let produtoNome: string | undefined;
    if (promo.produtoId) {
      const prod = await prisma.produtos.findUnique({
        where: { id: promo.produtoId },
        select: { nome: true },
      });
      produtoNome = prod?.nome ?? undefined;
    }

    const motivo =
      promo.segmento === 'intent_alta'
        ? 'Alta intenção de compra na sua região'
        : promo.segmento === 'churn_risco'
          ? 'Oferta para reativar seu hábito PRECIVOX'
          : promo.segmento === 'cesta_semana'
            ? 'Baseado nos itens da sua lista recente'
            : 'Promo exclusiva do mercado';

    out.push({
      id: promo.id,
      titulo: promo.titulo,
      descontoPct: promo.descontoPct,
      produtoId: promo.produtoId,
      produtoNome,
      categoria: promo.categoria,
      validoAte: promo.validoAte,
      motivo,
    });
  }

  return out.slice(0, 3);
}

export function segmentoLabel(s: PromoSegmento): string {
  const map: Record<PromoSegmento, string> = {
    intent_alta: 'Alta intenção',
    churn_risco: 'Risco de churn',
    cesta_semana: 'Lista da semana',
    todos: 'Todos os usuários',
  };
  return map[s];
}
