import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extrairBearerToken,
  validarChaveParceiro,
  validarElegibilidadeWebhook,
} from '@/lib/partner-api-auth';
import { aplicarPrecosInboundWebhook, type InboundPrecoItem } from '@/lib/parceiro-webhook-preco';

export const dynamic = 'force-dynamic';

type Body = {
  mercadoId?: string;
  unidadeId?: string;
  eventId?: string;
  alteracoes?: InboundPrecoItem[];
  itens?: InboundPrecoItem[];
};

/**
 * POST /api/partner/v1/preco-alterado
 * Delta incremental de preços (Tier 3). Auth: Bearer PARTNER_API_KEYS
 */
export async function POST(req: NextRequest) {
  const keysConfigured = Boolean(process.env.PARTNER_API_KEYS?.trim());
  if (!keysConfigured) {
    return NextResponse.json(
      { success: false, error: 'PARTNER_API_KEYS não configurado no servidor' },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido' }, { status: 400 });
  }

  const mercadoId = String(body.mercadoId ?? '').trim();
  const unidadeId = String(body.unidadeId ?? '').trim();
  const alteracoes = Array.isArray(body.alteracoes)
    ? body.alteracoes
    : Array.isArray(body.itens)
      ? body.itens
      : [];

  if (!mercadoId || !unidadeId) {
    return NextResponse.json(
      { success: false, error: 'mercadoId e unidadeId são obrigatórios' },
      { status: 400 }
    );
  }

  if (alteracoes.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Envie ao menos uma alteração em alteracoes[]' },
      { status: 400 }
    );
  }

  if (alteracoes.length > 500) {
    return NextResponse.json(
      { success: false, error: 'Máximo de 500 alterações por requisição' },
      { status: 400 }
    );
  }

  const token = extrairBearerToken(req.headers.get('authorization'));
  if (!validarChaveParceiro(mercadoId, token)) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  const elegivel = await validarElegibilidadeWebhook(mercadoId);
  if (elegivel.ok === false) {
    return NextResponse.json({ success: false, error: elegivel.error }, { status: elegivel.status });
  }

  if (body.eventId) {
    const dup = await prisma.acoes_gestor.findFirst({
      where: {
        mercadoId,
        tipo: 'webhook_preco_event',
        descricao: body.eventId,
      },
      select: { id: true },
    });
    if (dup) {
      return NextResponse.json({
        success: true,
        message: 'Evento já processado (idempotente)',
        data: { aplicados: 0, duplicado: true },
      });
    }
  }

  try {
    const result = await aplicarPrecosInboundWebhook({ mercadoId, unidadeId, alteracoes });

    if (body.eventId && result.aplicados > 0) {
      await prisma.acoes_gestor.create({
        data: {
          id: `wh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          mercadoId,
          userId: 'partner_webhook',
          tipo: 'webhook_preco_event',
          descricao: body.eventId,
          resultadoEsperado: { unidadeId, aplicados: result.aplicados },
        },
      });
    }

    return NextResponse.json({
      success: result.aplicados > 0 || result.erros.length === 0,
      message: `${result.aplicados} preço(s) atualizado(s)`,
      data: {
        aplicados: result.aplicados,
        erros: result.erros.length > 0 ? result.erros.slice(0, 20) : undefined,
        eventId: body.eventId,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro ao processar webhook';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
