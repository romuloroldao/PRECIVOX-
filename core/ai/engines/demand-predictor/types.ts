/**
 * Demand Predictor - Types and Interfaces
 */

export interface DemandPredictionInput {
    produtoId: string;
    unidadeId: string;
    periodoHistorico: number; // dias de histórico para análise
    periodoPrevisao: number; // dias para prever no futuro
}

export interface DemandPredictionOutput {
    produtoId: string;
    unidadeId: string;
    previsoes: DailyDemand[];
    confianca: number; // 0-1
    tendencia: 'CRESCENTE' | 'ESTAVEL' | 'DECRESCENTE';
    sazonalidade: SeasonalityPattern;
    metricas: DemandMetrics;
    recomendacoes: string[];
}

export interface DailyDemand {
    data: Date;
    quantidadeEsperada: number;
    intervaloConfianca: {
        min: number;
        max: number;
    };
}

export interface SeasonalityPattern {
    score: number; // 0-1 (0 = sem sazonalidade, 1 = alta sazonalidade)
    picos: Date[]; // Datas de pico de demanda
    vales: Date[]; // Datas de baixa demanda
    padraoSemanal?: {
        [key: string]: number; // dia da semana -> multiplicador
    };
}

export interface DemandMetrics {
    mediaDiaria: number;
    desvioPadrao: number;
    coeficienteVariacao: number;
    totalPrevisto: number;
}
