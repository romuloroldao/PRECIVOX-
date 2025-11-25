/**
 * API Route: Demand Prediction
 * POST /api/ai/demand-prediction
 */

import { NextRequest, NextResponse } from 'next/server';
import { DemandPredictor } from '@/core/ai';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { produtoId, unidadeId, periodoHistorico, periodoPrevisao } = body;

        // Validar parâmetros
        if (!produtoId || !unidadeId) {
            return NextResponse.json({
                success: false,
                error: 'produtoId e unidadeId são obrigatórios'
            }, { status: 400 });
        }

        // Criar engine e executar previsão
        const predictor = new DemandPredictor();
        const result = await predictor.predict({
            produtoId,
            unidadeId,
            periodoHistorico: periodoHistorico || 30,
            periodoPrevisao: periodoPrevisao || 7
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Erro na API de previsão de demanda:', error);

        return NextResponse.json({
            success: false,
            error: error.message || 'Erro interno do servidor'
        }, { status: 500 });
    }
}
