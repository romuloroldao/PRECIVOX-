/**
 * API: GROOC - IA Central do Precivox
 * 
 * POST /api/ai/grooc
 * Body: { pergunta: string, mercadoId: string, userId?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { GroocEngine } from '@/lib/ai/grooc-engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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

    // Apenas ADMIN e GESTOR podem usar GROOC
    if (user.role !== 'ADMIN' && user.role !== 'GESTOR') {
      return NextResponse.json(
        { error: 'Acesso negado', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { pergunta, mercadoId, userId } = body;

    if (!pergunta || !mercadoId) {
      return NextResponse.json(
        { error: 'pergunta e mercadoId são obrigatórios' },
        { status: 400 }
      );
    }

    // Processar pergunta com GROOC
    const resposta = await GroocEngine.answerQuestion(
      pergunta,
      mercadoId,
      userId || user.id
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

