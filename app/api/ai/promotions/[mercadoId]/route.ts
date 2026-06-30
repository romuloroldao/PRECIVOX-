/**
 * API: Sugestões de Promoção
 * 
 * GET /api/ai/promotions/[mercadoId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { PromotionEngine } from '@/lib/ai';
import { isGestorAuthResponse, requireGestorApiAccess } from '@/lib/gestor-api-mercado';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { mercadoId: string } }
) {
  try {
    // Validar autenticação e escopo do mercado (GESTOR só acessa o próprio mercado)
    const auth = await requireGestorApiAccess(req, params.mercadoId);
    if (isGestorAuthResponse(auth)) return auth.response;

    const mercadoId = auth.mercadoId;
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

