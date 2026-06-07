/**
 * API Route: Stock Health Analysis
 * POST /api/ai/stock-health
 */

import { NextRequest, NextResponse } from 'next/server';
import { StockHealthEngine } from '@/core/ai';
import { isAuthResponse, requireApiSession } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
    const auth = await requireApiSession(request, { roles: ['ADMIN', 'GESTOR'] });
    if (isAuthResponse(auth)) return auth;

    try {
        const body = await request.json();
        const { unidadeId, mercadoId, categorias } = body;

        if (!unidadeId || !mercadoId) {
            return NextResponse.json({
                success: false,
                error: 'unidadeId e mercadoId são obrigatórios'
            }, { status: 400 });
        }

        const engine = new StockHealthEngine();
        const result = await engine.analyze({
            unidadeId,
            mercadoId,
            categorias: categorias || []
        });

        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro interno do servidor';
        console.error('Erro na API de análise de estoque:', error);

        return NextResponse.json({
            success: false,
            error: message
        }, { status: 500 });
    }
}
