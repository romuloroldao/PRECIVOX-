/**
 * Smart Pricing Engine - Types and Interfaces
 */

export interface PricingAnalysisInput {
    produtoId: string;
    unidadeId?: string; // Opcional se mercadoId for fornecido
    mercadoId?: string; // Filtrar por mercado específico
    precoAtual?: number; // Opcional, será buscado do banco se não fornecido
    custoProduto?: number;
}

export interface PricingAnalysisOutput {
    produtoId: string;
    unidadeId: string;
    elasticidade: number;
    precoOtimo: number;
    impactoEstimado: PriceImpact;
    competitividade: CompetitivenessAnalysis;
    recomendacoes: PricingRecommendation[];
}

export interface PriceImpact {
    variacaoPreco: number; // %
    variacaoVendas: number; // %
    variacaoReceita: number; // %
    variacaoMargem: number; // %
}

export interface CompetitivenessAnalysis {
    posicao: 'MAIS_BARATO' | 'COMPETITIVO' | 'MAIS_CARO';
    diferencaMedia: number; // %
    precoMercado: number;
    ranking: number; // 1-5 (1 = mais barato)
}

export interface PricingRecommendation {
    tipo: 'AUMENTAR' | 'REDUZIR' | 'MANTER' | 'PROMOCAO';
    precoSugerido: number;
    justificativa: string;
    impactoEsperado: string;
    prioridade: 'BAIXA' | 'MEDIA' | 'ALTA';
    confianca: number; // 0-1
}
