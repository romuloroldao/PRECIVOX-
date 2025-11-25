/**
 * Enhanced GROOC Recommendation Engine - Types
 * Recomendações inteligentes baseadas em múltiplos critérios
 */

export interface RecommendationInput {
    listaComprasId?: string;
    produtos: ProductRequest[];
    localizacaoUsuario?: {
        latitude: number;
        longitude: number;
    };
    preferencias?: UserPreferences;
    historicoUsuario?: UserHistory;
}

export interface ProductRequest {
    produtoId?: string;
    nome: string;
    categoria?: string;
    quantidade: number;
    precoMaximo?: number;
}

export interface RecommendationOutput {
    recomendacoes: ProductRecommendation[];
    rotaOtimizada?: RouteOptimization;
    economiaEstimada: number;
    tempoEstimado: number;
    resumo: RecommendationSummary;
}

export interface ProductRecommendation {
    produtoOriginal: string;
    produtoId: string;
    produtoNome: string;
    tipo: 'SUBSTITUTO' | 'COMPLEMENTAR' | 'PROMOCAO' | 'MELHOR_PRECO' | 'MAIS_SAUDAVEL';
    unidadeSugerida: string;
    unidadeNome: string;
    preco: number;
    precoOriginal?: number;
    economia: number;
    economiaPercentual: number;
    distancia?: number;
    estoque: number;
    marca: string;
    categoria: string;

    // Scores de compatibilidade
    scores: {
        custoBeneficio: number; // 0-100
        compatibilidade: number; // 0-100
        estoque: number; // 0-100
        saude: number; // 0-100
        preferencia: number; // 0-100
        total: number; // 0-100
    };

    // Atributos de saúde
    atributosSaude?: {
        calorias?: number;
        gorduras?: number;
        acucares?: number;
        sodio?: number;
        organico?: boolean;
        integral?: boolean;
        semGluten?: boolean;
        semLactose?: boolean;
        vegano?: boolean;
    };

    justificativa: string[];
    confianca: number;
    prioridade: 'ALTA' | 'MEDIA' | 'BAIXA';
}

export interface RouteOptimization {
    unidades: RouteStop[];
    distanciaTotal: number;
    tempoEstimado: number;
    economiaTotal: number;
    eficiencia: number;
    ordemOtimizada: boolean;
}

export interface RouteStop {
    unidadeId: string;
    unidadeNome: string;
    endereco: string;
    produtos: ProductRecommendation[];
    ordem: number;
    distancia: number;
    tempoEstimado: number;
    economiaAcumulada: number;
    latitude?: number;
    longitude?: number;
}

export interface UserPreferences {
    prefereMenorPreco: boolean;
    prefereMenorDistancia: boolean;
    marcasPreferidas?: string[];
    marcasEvitar?: string[];
    categoriasEvitar?: string[];
    opcoesSaudaveis: boolean;
    distanciaMaxima?: number;
    precoMaximoPorItem?: number;
    aceitaSubstitutos: boolean;
}

export interface UserHistory {
    produtosComprados: HistoricalProduct[];
    marcasFrequentes: string[];
    categoriasFrequentes: string[];
    precoMedioGasto: number;
    frequenciaCompra: 'ALTA' | 'MEDIA' | 'BAIXA';
}

export interface HistoricalProduct {
    produtoId: string;
    nome: string;
    marca: string;
    categoria: string;
    preco: number;
    quantidade: number;
    dataCompra: Date;
    satisfacao?: number; // 1-5
}

export interface RecommendationSummary {
    totalProdutos: number;
    totalRecomendacoes: number;
    economiaTotal: number;
    economiaMedia: number;
    scoreGeralSaude: number;
    scoreGeralCustoBeneficio: number;
    produtosForaEstoque: number;
    produtosSubstituidos: number;
}
