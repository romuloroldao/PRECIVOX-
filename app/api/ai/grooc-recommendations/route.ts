/**
 * API Route: GROOC Recommendations
 * POST /api/ai/grooc-recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { GROOCRecommendationEngine } from '@/core/ai';
import { isAuthResponse, requireApiSession } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
    const auth = await requireApiSession(request, { roles: ['ADMIN', 'GESTOR', 'CLIENTE'] });
    if (isAuthResponse(auth)) return auth;

    try {
        const body = await request.json();
        const { produtos, localizacaoUsuario, preferencias } = body;

        if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'produtos deve ser um array não vazio'
            }, { status: 400 });
        }

        const engine = new GROOCRecommendationEngine();
        const result = await engine.recommend({
            produtos,
            localizacaoUsuario,
            preferencias
        });

        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro interno do servidor';
        console.error('Erro na API de recomendações:', error);

        return NextResponse.json({
            success: false,
            error: message
        }, { status: 500 });
    }
}
