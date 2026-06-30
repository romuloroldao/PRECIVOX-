import { NextRequest, NextResponse } from 'next/server';
import { isGestorAuthResponse, requireGestorApiAccess } from '@/lib/gestor-api-mercado';
import { loadDemandPredictions } from '@/lib/ai-engines-from-db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const mercadoId = typeof body.mercadoId === 'string' ? body.mercadoId : null;

    const auth = await requireGestorApiAccess(req, mercadoId);
    if (isGestorAuthResponse(auth)) return auth.response;

    const predictions = await loadDemandPredictions(auth.mercadoId);

    return NextResponse.json({
      success: true,
      data: { predictions },
    });
  } catch (error) {
    console.error('[API ai-engines/demand]', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar previsões de demanda' },
      { status: 500 }
    );
  }
}
