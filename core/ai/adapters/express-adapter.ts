/**
 * Express Adapter - Converte saída dos engines para formato compatível com rotas Express
 * Garante compatibilidade com a estrutura atual dos mocks
 */

import { DemandPredictor } from '../engines/demand-predictor';
import { StockHealthEngine } from '../engines/stock-health';
import { SmartPricingEngine } from '../engines/smart-pricing';
import { GROOCRecommendationEngine } from '../engines/grooc-recommendation';
import { initPrisma } from '../lib/prisma-compat';

// Inicializar Prisma quando o adapter for carregado
let prismaInitialized = false;

export function initializeEngines(prisma: any) {
    if (!prismaInitialized) {
        initPrisma(prisma);
        prismaInitialized = true;
    }
}

/**
 * Adapter para Demand Predictor
 */
export async function adaptDemandPrediction(
    produtoId: string,
    unidadeId: string,
    periodoHistorico?: number,
    periodoPrevisao?: number,
    userId?: string
) {
    const predictor = new DemandPredictor();
    const result = await predictor.predict({
        produtoId,
        unidadeId,
        periodoHistorico: periodoHistorico || 30,
        periodoPrevisao: periodoPrevisao || 7
    });

    if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao executar previsão de demanda');
    }

    // Converter datas para formato compatível
    const previsoes = result.data.previsoes.map(p => ({
        data: p.data,
        quantidadeEsperada: p.quantidadeEsperada,
        intervaloConfianca: p.intervaloConfianca
    }));

    return {
        success: true,
        data: {
            produtoId,
            unidadeId,
            previsoes,
            confianca: result.data.confianca,
            tendencia: result.data.tendencia,
            sazonalidade: result.data.sazonalidade,
            metricas: result.data.metricas,
            recomendacoes: result.data.recomendacoes
        },
        metadata: {
            ...result.metadata,
            userId
        }
    };
}

/**
 * Adapter para Stock Health Engine
 */
export async function adaptStockHealth(
    unidadeId: string,
    mercadoId: string,
    categorias?: string[],
    userId?: string
) {
    const engine = new StockHealthEngine();
    const result = await engine.analyze({
        unidadeId,
        mercadoId,
        categorias
    });

    if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao analisar saúde do estoque');
    }

    return {
        success: true,
        data: {
            unidadeId,
            score: result.data.score,
            status: result.data.status,
            alertas: result.data.alertas,
            metricas: result.data.metricas,
            recomendacoes: result.data.recomendacoes,
            analiseDetalhada: result.data.analiseDetalhada
        },
        metadata: {
            ...result.metadata,
            userId
        }
    };
}

/**
 * Adapter para Smart Pricing Engine
 */
export async function adaptSmartPricing(
    produtoId: string,
    unidadeId: string,
    precoAtual: number,
    custoProduto?: number,
    userId?: string
) {
    const engine = new SmartPricingEngine();
    const result = await engine.analyze({
        produtoId,
        unidadeId,
        precoAtual,
        custoProduto
    });

    if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao analisar precificação');
    }

    return {
        success: true,
        data: {
            produtoId,
            unidadeId,
            elasticidade: result.data.elasticidade,
            precoOtimo: result.data.precoOtimo,
            impactoEstimado: result.data.impactoEstimado,
            competitividade: result.data.competitividade,
            recomendacoes: result.data.recomendacoes
        },
        metadata: {
            ...result.metadata,
            userId
        }
    };
}

/**
 * Adapter para GROOC Recommendation Engine
 */
export async function adaptGROOCRecommendation(
    produtos: any[],
    localizacaoUsuario?: any,
    preferencias?: any,
    historicoUsuario?: any,
    userId?: string
) {
    const engine = new GROOCRecommendationEngine();
    const result = await engine.recommend({
        produtos,
        localizacaoUsuario,
        preferencias,
        historicoUsuario
    });

    if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao gerar recomendações GROOC');
    }

    return {
        success: true,
        data: {
            recomendacoes: result.data.recomendacoes,
            rotaOtimizada: result.data.rotaOtimizada,
            economiaEstimada: result.data.economiaEstimada,
            tempoEstimado: result.data.tempoEstimado,
            resumo: result.data.resumo
        },
        metadata: {
            ...result.metadata,
            userId
        }
    };
}

