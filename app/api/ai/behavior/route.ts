/**
 * API: Análise de Comportamento do Usuário
 * 
 * GET /api/ai/behavior?userId=xxx&mercadoId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { MarketBehaviorEngine } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || user.id;
    const mercadoId = searchParams.get('mercadoId');
    const diasAnalise = parseInt(searchParams.get('dias') || '30');

    if (!mercadoId) {
      return NextResponse.json(
        { error: 'mercadoId é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar permissão (admin ou próprio usuário)
    if (user.role !== 'ADMIN' && userId !== user.id) {
      return NextResponse.json(
        { error: 'Acesso negado', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Analisar comportamento
    const resultado = await MarketBehaviorEngine.analyzeUserBehavior(
      userId,
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
    console.error('[API /ai/behavior] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao analisar comportamento', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

