/**
 * API: Relatório Semanal de Saúde do Mercado
 * 
 * GET /api/ai/report/[mercadoId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { ReportGenerator } from '@/lib/ai';

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

    // Apenas ADMIN e GESTOR podem ver relatórios
    if (user.role !== 'ADMIN' && user.role !== 'GESTOR') {
      return NextResponse.json(
        { error: 'Acesso negado', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const mercadoId = params.mercadoId;

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

