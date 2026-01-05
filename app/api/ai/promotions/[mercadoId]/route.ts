/**
 * API: Sugestões de Promoção
 * 
 * GET /api/ai/promotions/[mercadoId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { PromotionEngine } from '@/lib/ai';

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

    // Apenas ADMIN e GESTOR podem ver sugestões de promoção
    if (user.role !== 'ADMIN' && user.role !== 'GESTOR') {
      return NextResponse.json(
        { error: 'Acesso negado', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const mercadoId = params.mercadoId;
    const limite = parseInt(
      new URL(req.url).searchParams.get('limite') || '10'
    );

    // Gerar sugestões de promoção
    const resultado = await PromotionEngine.generatePromotionSuggestions(
      mercadoId,
      limite
    );

    return NextResponse.json({
      success: true,
      data: resultado.data,
      explicacao: resultado.explicacao,
      confianca: resultado.confianca,
      fatores: resultado.fatores,
    });
  } catch (error) {
    console.error('[API /ai/promotions] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar sugestões de promoção', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

