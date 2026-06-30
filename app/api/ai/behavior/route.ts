/**
 * API: Análise de Comportamento do Usuário
 * 
 * GET /api/ai/behavior?userId=xxx&mercadoId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { MarketBehaviorEngine } from '@/lib/ai';
import { TokenManager } from '@/lib/token-manager';
import { resolveMercadoIdForGestorApi } from '@/lib/gestor-api-mercado';

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
    const mercadoId = searchParams.get('mercadoId');
    const diasAnalise = parseInt(searchParams.get('dias') || '30');
    const userId = user.role === 'ADMIN' ? (searchParams.get('userId') || user.id) : user.id;

    if (!mercadoId) {
      return NextResponse.json(
        { error: 'mercadoId é obrigatório' },
        { status: 400 }
      );
    }

    // GESTOR/ADMIN: validar acesso ao mercado; CLIENTE só consulta o próprio comportamento
    if (user.role === 'GESTOR' || user.role === 'ADMIN') {
      const mercadoOk = await resolveMercadoIdForGestorApi(user, mercadoId);
      if (mercadoOk.ok === false) {
        return NextResponse.json(
          { error: mercadoOk.error, code: 'FORBIDDEN' },
          { status: mercadoOk.status }
        );
      }
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

