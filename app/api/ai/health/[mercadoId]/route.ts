/**
 * API: Health Score do Mercado
 * 
 * GET /api/ai/health/[mercadoId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { MarketHealthEngine } from '@/lib/ai';
import { isGestorAuthResponse, requireGestorApiAccess } from '@/lib/gestor-api-mercado';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { mercadoId: string } }
) {
  try {
    const auth = await requireGestorApiAccess(req, params.mercadoId);
    if (isGestorAuthResponse(auth)) return auth.response;

    const mercadoId = auth.mercadoId;
    const diasAnalise = parseInt(
      new URL(req.url).searchParams.get('dias') || '30'
    );

    // Calcular health score
    const resultado = await MarketHealthEngine.calculateHealthScore(
      mercadoId,
      diasAnalise
    );

    return NextResponse.json({
      success: true,
      data: resultado.data,
      explicacao: resultado.explicacao,
      confianca: resultado.confianca,
      fatores: resultado.fatores,
    });
  } catch (error) {
    console.error('[API /ai/health] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao calcular health score', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

