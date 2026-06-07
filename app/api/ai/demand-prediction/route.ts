/**
 * API Route: Demand Prediction
 * POST /api/ai/demand-prediction
 */

import { NextRequest, NextResponse } from 'next/server';
import { DemandPredictor } from '@/core/ai';
import { isAuthResponse, requireApiSession } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
    const auth = await requireApiSession(request, { roles: ['ADMIN', 'GESTOR'] });
    if (isAuthResponse(auth)) return auth;

    try {
        const body = await request.json();
        const { produtoId, unidadeId, periodoHistorico, periodoPrevisao } = body;

        if (!produtoId || !unidadeId) {
            return NextResponse.json({
                success: false,
                error: 'produtoId e unidadeId são obrigatórios'
            }, { status: 400 });
        }

        const predictor = new DemandPredictor();
        const result = await predictor.predict({
            produtoId,
            unidadeId,
            periodoHistorico: periodoHistorico || 30,
            periodoPrevisao: periodoPrevisao || 7
        });

        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro interno do servidor';
        console.error('Erro na API de previsão de demanda:', error);

        return NextResponse.json({
            success: false,
            error: message
        }, { status: 500 });
    }
}
