/**
 * API: GROOC - IA Central do Precivox
 * 
 * POST /api/ai/grooc
 * Body: { pergunta: string, mercadoId: string, userId?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { GroocEngine } from '@/lib/ai/grooc-engine';
import { isGestorAuthResponse, requireGestorApiAccess } from '@/lib/gestor-api-mercado';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pergunta, mercadoId } = body;

    if (!pergunta || !mercadoId) {
      return NextResponse.json(
        { error: 'pergunta e mercadoId são obrigatórios' },
        { status: 400 }
      );
    }

    const auth = await requireGestorApiAccess(req, mercadoId);
    if (isGestorAuthResponse(auth)) return auth.response;

    const resposta = await GroocEngine.answerQuestion(
      pergunta,
      auth.mercadoId,
      auth.user.id
    );

    return NextResponse.json({
      success: true,
      data: resposta,
    });
  } catch (error) {
    console.error('[API /ai/grooc] Erro:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar pergunta',
        details: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 500 }
    );
  }
}

