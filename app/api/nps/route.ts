import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/nps — registra NPS (0–10) do cliente para um mercado.
 * Disparar após compra, visita ou pesquisa (com throttle no cliente para não spammar).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });

    if (!user || user.role !== 'CLIENTE') {
      return NextResponse.json({ error: 'Apenas clientes autenticados' }, { status: 403 });
    }

    const body = await req.json();
    const mercadoId = typeof body.mercadoId === 'string' ? body.mercadoId : '';
    const score = Number(body.score);
    const comment = typeof body.comment === 'string' ? body.comment.slice(0, 2000) : null;
    const gatilho =
      typeof body.gatilho === 'string' ? body.gatilho.slice(0, 64) : null;

    if (!mercadoId) {
      return NextResponse.json({ error: 'mercadoId obrigatório' }, { status: 400 });
    }

    if (!Number.isInteger(score) || score < 0 || score > 10) {
      return NextResponse.json({ error: 'score deve ser inteiro entre 0 e 10' }, { status: 400 });
    }

    const mercado = await prisma.mercados.findFirst({
      where: { id: mercadoId, ativo: true },
      select: { id: true },
    });
    if (!mercado) {
      return NextResponse.json({ error: 'Mercado inválido' }, { status: 400 });
    }

    await prisma.npsResponse.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        mercadoId,
        score,
        comment,
        ...(gatilho ? { gatilho } : {}),
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[POST /api/nps]', e);
    return NextResponse.json({ error: 'Erro ao salvar NPS' }, { status: 500 });
  }
}
