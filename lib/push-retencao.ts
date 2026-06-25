/**
 * Push de retenção — cesta provável (2.3) e dia de mercado (6.3)
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { EventCollector } from '@/lib/ai/event-collector';
import { MarketBehaviorEngine } from '@/lib/ai/behavior-engine';
import { montarCestaProvavel, inferirDiaMercado, inferirHorasAteCompraProvavel } from '@/lib/cesta-provavel';
import { calcularIntentScore } from '@/lib/ai/intent-score-engine';
import { deliverPushToToken, isPushDeliveryAvailable } from '@/lib/push-delivery';

export type PushRetencaoTipo = 'cesta_provavel' | 'dia_mercado';

export type PushRetencaoState = {
  cestaProvavelEm?: string;
  diaMercadoEm?: string;
  /** ISO week key YYYY-Www — evita repetir no mesmo dia da semana */
  diaMercadoSemanaKey?: string;
};

const MIN_INTENT_CESTA = 48;
const MIN_ITENS_CESTA = 3;
const COOLDOWN_CESTA_H = 48;
const COOLDOWN_DIA_MERCADO_D = 6;
/** Janela explícita de push cesta provável (roadmap 2.3) */
const JANELA_PUSH_MIN_H = 48;
const JANELA_PUSH_MAX_H = 72;

function isoWeekKey(d: Date): string {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const year = tmp.getUTCFullYear();
  const week = Math.ceil(((tmp.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function horasDesde(iso?: string): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / (1000 * 60 * 60);
}

function diasDesde(iso?: string): number | null {
  const h = horasDesde(iso);
  return h == null ? null : h / 24;
}

export function parsePushRetencaoState(perfilPreci: unknown): PushRetencaoState {
  if (!perfilPreci || typeof perfilPreci !== 'object') return {};
  const s = (perfilPreci as { pushRetencao?: PushRetencaoState }).pushRetencao;
  return s && typeof s === 'object' ? s : {};
}

async function persistPushRetencaoState(
  userId: string,
  patch: Partial<PushRetencaoState>
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { perfilPreci: true },
  });
  const base =
    user?.perfilPreci && typeof user.perfilPreci === 'object'
      ? { ...(user.perfilPreci as Record<string, unknown>) }
      : {};
  const prev = parsePushRetencaoState(base);
  base.pushRetencao = { ...prev, ...patch };
  await prisma.user.update({
    where: { id: userId },
    data: { perfilPreci: base as Prisma.InputJsonValue },
  });
}

export async function resolverMercadoPreferido(userId: string): Promise<string | null> {
  const desde = new Date();
  desde.setDate(desde.getDate() - 90);

  const eventos = await prisma.userEvent.findMany({
    where: { userId, timestamp: { gte: desde }, mercadoId: { not: null } },
    select: { mercadoId: true },
    take: 500,
  });

  const contagem = new Map<string, number>();
  for (const ev of eventos) {
    if (!ev.mercadoId) continue;
    contagem.set(ev.mercadoId, (contagem.get(ev.mercadoId) ?? 0) + 1);
  }

  let best: string | null = null;
  let max = 0;
  contagem.forEach((n, id) => {
    if (n > max) {
      max = n;
      best = id;
    }
  });

  if (best) return best;

  const ev = await prisma.userEvent.findFirst({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    select: { mercadoId: true },
  });
  return ev?.mercadoId ?? null;
}

export type AvaliacaoPushRetencao =
  | { enviar: false; motivo: string }
  | {
      enviar: true;
      tipo: PushRetencaoTipo;
      titulo: string;
      corpo: string;
      link: string;
      mercadoId: string;
    };

export async function avaliarPushCestaProvavel(
  userId: string,
  mercadoId: string,
  state: PushRetencaoState
): Promise<AvaliacaoPushRetencao> {
  const h = horasDesde(state.cestaProvavelEm);
  if (h != null && h < COOLDOWN_CESTA_H) {
    return { enviar: false, motivo: 'cooldown_cesta' };
  }

  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 60);

  const eventos = await EventCollector.getUserEvents(userId, mercadoId, inicio, fim);
  const intent = calcularIntentScore(eventos, 72);
  const janela = inferirHorasAteCompraProvavel(eventos);

  if (janela.horasAteCompra != null && janela.confianca >= 25) {
    if (janela.horasAteCompra < JANELA_PUSH_MIN_H || janela.horasAteCompra > JANELA_PUSH_MAX_H) {
      return { enviar: false, motivo: 'fora_janela_48_72h' };
    }
  } else if (intent.score < MIN_INTENT_CESTA) {
    return { enviar: false, motivo: 'intent_baixo' };
  }

  const comprasRecentes = eventos.filter(
    (e) =>
      ['compra_confirmada', 'compra_realizada'].includes(e.type) &&
      (Date.now() - new Date(e.timestamp).getTime()) / 86400000 < 3
  );
  if (comprasRecentes.length > 0) {
    return { enviar: false, motivo: 'comprou_recentemente' };
  }

  const cesta = await montarCestaProvavel(userId, mercadoId, 8);
  if (cesta.itens.length < MIN_ITENS_CESTA) {
    return { enviar: false, motivo: 'cesta_insuficiente' };
  }

  const top = cesta.itens.slice(0, 3).map((i) => i.nome);
  const janelaLabel =
    janela.horasAteCompra != null
      ? `Compra provável em ~${Math.round(janela.horasAteCompra)}h. `
      : '';
  const corpo =
    top.length >= 2
      ? `${janelaLabel}${top.slice(0, 2).join(', ')} e mais ${Math.max(0, cesta.itens.length - 2)} itens — monte em 1 toque.`
      : `${janelaLabel}${cesta.mensagem}`;

  return {
    enviar: true,
    tipo: 'cesta_provavel',
    titulo: janela.horasAteCompra != null
      ? '🛒 Sua cesta para os próximos dias'
      : '🛒 Sua cesta provável está pronta',
    corpo,
    link: '/cliente/home',
    mercadoId,
  };
}

export async function avaliarPushDiaMercado(
  userId: string,
  mercadoId: string,
  state: PushRetencaoState,
  agora = new Date()
): Promise<AvaliacaoPushRetencao> {
  const weekKey = isoWeekKey(agora);
  if (state.diaMercadoSemanaKey === weekKey) {
    return { enviar: false, motivo: 'ja_enviado_semana' };
  }

  const d = diasDesde(state.diaMercadoEm);
  if (d != null && d < COOLDOWN_DIA_MERCADO_D) {
    return { enviar: false, motivo: 'cooldown_dia_mercado' };
  }

  const behavior = await MarketBehaviorEngine.analyzeUserBehavior(userId, mercadoId, 30);
  if (behavior.confianca < 25) {
    return { enviar: false, motivo: 'poucos_eventos' };
  }

  const diaMercado = inferirDiaMercado(behavior.data.horariosPico);
  if (!diaMercado) {
    return { enviar: false, motivo: 'dia_nao_inferido' };
  }

  const hoje = agora.getDay();
  const amanha = (hoje + 1) % 7;

  const ehDiaMercado = diaMercado.diaSemana === hoje;
  const ehVespera = diaMercado.diaSemana === amanha && agora.getHours() >= 17;

  if (!ehDiaMercado && !ehVespera) {
    return { enviar: false, motivo: 'fora_janela' };
  }

  if (ehDiaMercado && agora.getHours() < 7) {
    return { enviar: false, motivo: 'cedo_demais' };
  }

  const titulo = ehDiaMercado
    ? `🛍️ Hoje é seu dia de mercado (${diaMercado.label})`
    : `📅 Amanhã você costuma ir ao mercado (${diaMercado.label})`;

  const corpo = ehDiaMercado
    ? 'Revise sua cesta provável antes de sair — economize tempo e dinheiro.'
    : 'Monte a lista hoje à noite e chegue preparado na loja.';

  return {
    enviar: true,
    tipo: 'dia_mercado',
    titulo,
    corpo,
    link: '/cliente/home',
    mercadoId,
  };
}

export async function enviarPushRetencaoUsuario(
  userId: string,
  avaliacao: Extract<AvaliacaoPushRetencao, { enviar: true }>
): Promise<{ sent: number }> {
  const subs = await prisma.notificationSubscription.findMany({
    where: { userId, enabled: true },
    select: { token: true },
  });

  if (subs.length === 0) return { sent: 0 };

  let sent = 0;
  const invalidTokens: string[] = [];

  for (const { token } of subs) {
    const res = await deliverPushToToken(token, avaliacao.titulo, avaliacao.corpo, {
      type: avaliacao.tipo,
      link: avaliacao.link,
      mercadoId: avaliacao.mercadoId,
      userId,
    });
    if (res.success) sent++;
    else if (res.error === 'INVALID_TOKEN') invalidTokens.push(token);
  }

  if (invalidTokens.length > 0) {
    await prisma.notificationSubscription.deleteMany({
      where: { token: { in: invalidTokens } },
    });
  }

  if (sent > 0) {
    const now = new Date().toISOString();
    const patch: Partial<PushRetencaoState> =
      avaliacao.tipo === 'cesta_provavel'
        ? { cestaProvavelEm: now }
        : { diaMercadoEm: now, diaMercadoSemanaKey: isoWeekKey(new Date()) };
    await persistPushRetencaoState(userId, patch);
  }

  return { sent };
}

export type PushRetencaoResumo = {
  usuariosComToken: number;
  cestaEnviados: number;
  diaMercadoEnviados: number;
  ignorados: number;
  erros: number;
  pushDisponivel: boolean;
};

export async function executarPushRetencao(limite = 300): Promise<PushRetencaoResumo> {
  const resumo: PushRetencaoResumo = {
    usuariosComToken: 0,
    cestaEnviados: 0,
    diaMercadoEnviados: 0,
    ignorados: 0,
    erros: 0,
    pushDisponivel: isPushDeliveryAvailable(),
  };

  if (!resumo.pushDisponivel) return resumo;

  const userIds = await prisma.notificationSubscription.findMany({
    where: { enabled: true },
    distinct: ['userId'],
    select: { userId: true },
    take: limite,
  });

  resumo.usuariosComToken = userIds.length;

  for (const { userId } of userIds) {
    try {
      const mercadoId = await resolverMercadoPreferido(userId);
      if (!mercadoId) {
        resumo.ignorados++;
        continue;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { perfilPreci: true, role: true },
      });
      if (user?.role !== 'CLIENTE') {
        resumo.ignorados++;
        continue;
      }

      const state = parsePushRetencaoState(user?.perfilPreci);

      const dia = await avaliarPushDiaMercado(userId, mercadoId, state);
      if (dia.enviar) {
        const { sent } = await enviarPushRetencaoUsuario(userId, dia);
        if (sent > 0) {
          resumo.diaMercadoEnviados++;
          continue;
        }
      }

      const cesta = await avaliarPushCestaProvavel(userId, mercadoId, state);
      if (cesta.enviar) {
        const { sent } = await enviarPushRetencaoUsuario(userId, cesta);
        if (sent > 0) resumo.cestaEnviados++;
        else resumo.ignorados++;
      } else {
        resumo.ignorados++;
      }
    } catch {
      resumo.erros++;
    }
  }

  return resumo;
}
