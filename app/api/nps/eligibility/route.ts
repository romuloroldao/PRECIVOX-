import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DIAS_ENTRE_RESPOSTAS = 30;

/**
 * Se o cliente pode enviar novo NPS para o mercado (evita spam).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });

    if (!user || user.role !== 'CLIENTE') {
      return NextResponse.json({ eligible: false });
    }

    const mercadoId = new URL(req.url).searchParams.get('mercadoId');
    if (!mercadoId) {
      return NextResponse.json({ eligible: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }

    const limite = new Date();
    limite.setDate(limite.getDate() - DIAS_ENTRE_RESPOSTAS);

    const recente = await prisma.npsResponse.findFirst({
      where: {
        userId: user.id,
        mercadoId,
        createdAt: { gte: limite },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      eligible: !recente,
      ultimaRespostaEm: recente?.createdAt?.toISOString() ?? null,
      diasMinimosEntreRespostas: DIAS_ENTRE_RESPOSTAS,
    });
  } catch (e) {
    console.error('[GET /api/nps/eligibility]', e);
    return NextResponse.json({ eligible: false });
  }
}
