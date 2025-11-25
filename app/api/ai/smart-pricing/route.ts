/**
 * API Route: Smart Pricing Analysis
 * POST /api/ai/smart-pricing
 */

import { NextRequest, NextResponse } from 'next/server';
import { SmartPricingEngine } from '@/core/ai';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { produtoId, unidadeId, precoAtual, custoProduto } = body;

        // Validar parâmetros
        if (!produtoId || !unidadeId || !precoAtual) {
            return NextResponse.json({
                success: false,
                error: 'produtoId, unidadeId e precoAtual são obrigatórios'
            }, { status: 400 });
        }

        // Criar engine e executar análise
        const engine = new SmartPricingEngine();
        const result = await engine.analyze({
            produtoId,
            unidadeId,
            precoAtual,
            custoProduto
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Erro na API de precificação:', error);

        return NextResponse.json({
            success: false,
            error: error.message || 'Erro interno do servidor'
        }, { status: 500 });
    }
}
