/**
 * API: Health Score do Mercado
 * 
 * GET /api/ai/health/[mercadoId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { MarketHealthEngine } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { mercadoId: string } }
) {
  try {
    // Validar autenticação
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Apenas ADMIN e GESTOR podem ver health score
    if (user.role !== 'ADMIN' && user.role !== 'GESTOR') {
      return NextResponse.json(
        { error: 'Acesso negado', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const mercadoId = params.mercadoId;
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

