/**
 * API Route: GROOC Recommendations
 * POST /api/ai/grooc-recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { GROOCRecommendationEngine } from '@/core/ai';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { produtos, localizacaoUsuario, preferencias } = body;

        // Validar parâmetros
        if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'produtos deve ser um array não vazio'
            }, { status: 400 });
        }

        // Criar engine e executar recomendação
        const engine = new GROOCRecommendationEngine();
        const result = await engine.recommend({
            produtos,
            localizacaoUsuario,
            preferencias
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Erro na API de recomendações:', error);

        return NextResponse.json({
            success: false,
            error: error.message || 'Erro interno do servidor'
        }, { status: 500 });
    }
}
