/**
 * API Route: Smart Pricing Analysis
 * POST /api/ai/smart-pricing
 */

import { NextRequest, NextResponse } from 'next/server';
import { SmartPricingEngine } from '@/core/ai';
import { isAuthResponse, requireApiSession } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
    const auth = await requireApiSession(request, { roles: ['ADMIN', 'GESTOR'] });
    if (isAuthResponse(auth)) return auth;

    try {
        const body = await request.json();
        const { produtoId, unidadeId, precoAtual, custoProduto } = body;

        if (!produtoId || !unidadeId || !precoAtual) {
            return NextResponse.json({
                success: false,
                error: 'produtoId, unidadeId e precoAtual são obrigatórios'
            }, { status: 400 });
        }

        const engine = new SmartPricingEngine();
        const result = await engine.analyze({
            produtoId,
            unidadeId,
            precoAtual,
            custoProduto
        });

        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro interno do servidor';
        console.error('Erro na API de precificação:', error);

        return NextResponse.json({
            success: false,
            error: message
        }, { status: 500 });
    }
}
