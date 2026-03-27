import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DIAS = 60;

/**
 * Mercado mais frequente nas interações recentes do cliente (eventos de IA).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });

    if (!user || user.role !== 'CLIENTE') {
      return NextResponse.json({ mercadoId: null, mercadoNome: null });
    }

    const inicio = new Date();
    inicio.setDate(inicio.getDate() - DIAS);

    const grupos = await prisma.userEvent.groupBy({
      by: ['mercadoId'],
      where: {
        userId: user.id,
        timestamp: { gte: inicio },
      },
      _count: { id: true },
    });

    if (grupos.length === 0) {
      return NextResponse.json({ mercadoId: null, mercadoNome: null });
    }

    grupos.sort((a, b) => b._count.id - a._count.id);
    const top = grupos[0];
    if (!top?.mercadoId) {
      return NextResponse.json({ mercadoId: null, mercadoNome: null });
    }

    const m = await prisma.mercados.findFirst({
      where: { id: top.mercadoId, ativo: true },
      select: { id: true, nome: true },
    });

    return NextResponse.json({
      mercadoId: m?.id ?? null,
      mercadoNome: m?.nome ?? null,
    });
  } catch (e) {
    console.error('[GET /api/nps/suggest-mercado]', e);
    return NextResponse.json({ mercadoId: null, mercadoNome: null });
  }
}
