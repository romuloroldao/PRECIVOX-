/**
 * API: Relatório Semanal de Saúde do Mercado
 * 
 * GET /api/ai/report/[mercadoId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReportGenerator } from '@/lib/ai';
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

    // Gerar relatório semanal
    const resultado = await ReportGenerator.generateWeeklyReport(mercadoId);

    return NextResponse.json({
      success: true,
      data: resultado.data,
      explicacao: resultado.explicacao,
      confianca: resultado.confianca,
      fatores: resultado.fatores,
    });
  } catch (error) {
    console.error('[API /ai/report] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

