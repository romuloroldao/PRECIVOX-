/**
 * API Route: Stock Health Analysis
 * POST /api/ai/stock-health
 */

import { NextRequest, NextResponse } from 'next/server';
import { StockHealthEngine } from '@/core/ai';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { unidadeId, mercadoId, categorias } = body;

        // Validar parâmetros
        if (!unidadeId || !mercadoId) {
            return NextResponse.json({
                success: false,
                error: 'unidadeId e mercadoId são obrigatórios'
            }, { status: 400 });
        }

        // Criar engine e executar análise
        const engine = new StockHealthEngine();
        const result = await engine.analyze({
            unidadeId,
            mercadoId,
            categorias: categorias || []
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Erro na API de análise de estoque:', error);

        return NextResponse.json({
            success: false,
            error: error.message || 'Erro interno do servidor'
        }, { status: 500 });
    }
}
