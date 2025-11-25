/**
 * Demand Calculator - Cálculos de previsão de demanda
 * Implementação MOCK usando média móvel simples
 * TODO: Substituir por modelos ARIMA, Prophet ou LSTM
 */

import { DemandPredictionInput, DemandPredictionOutput, DailyDemand, SeasonalityPattern } from './types';
import { SalesRecord } from '../../types/common';
import { logger } from '../../utils/logger';

export class DemandCalculator {
    private readonly ENGINE_NAME = 'DemandPredictor';

    /**
     * Calcula previsão de demanda usando média móvel simples (MOCK)
     */
    async calculate(input: DemandPredictionInput, historicalSales: SalesRecord[]): Promise<DemandPredictionOutput> {
        const startTime = Date.now();

        logger.info(this.ENGINE_NAME, 'Iniciando cálculo de previsão de demanda', {
            produtoId: input.produtoId,
            unidadeId: input.unidadeId,
            periodoHistorico: input.periodoHistorico,
            periodoPrevisao: input.periodoPrevisao,
            dadosHistoricos: historicalSales.length
        });

        // Validar dados de entrada
        if (historicalSales.length < 7) {
            logger.warn(this.ENGINE_NAME, 'Dados históricos insuficientes', {
                produtoId: input.produtoId,
                dadosDisponiveis: historicalSales.length
            });
        }

        // Calcular média móvel dos últimos 7 dias
        const windowSize = Math.min(7, historicalSales.length);
        const recentSales = historicalSales.slice(-windowSize);
        const avgDailySales = recentSales.reduce((sum, record) => sum + record.quantidade, 0) / recentSales.length;

        // Calcular desvio padrão
        const variance = recentSales.reduce((sum, record) => {
            return sum + Math.pow(record.quantidade - avgDailySales, 2);
        }, 0) / recentSales.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = stdDev / avgDailySales;

        logger.debug(this.ENGINE_NAME, 'Estatísticas calculadas', {
            avgDailySales,
            stdDev,
            coefficientOfVariation
        });

        // Detectar padrão semanal
        const weeklyPattern = this.detectWeeklyPattern(historicalSales);

        // Gerar previsões
        const previsoes = this.generateForecasts(
            input.periodoPrevisao,
            avgDailySales,
            stdDev,
            weeklyPattern
        );

        // Detectar tendência
        const tendencia = this.detectTrend(previsoes);

        // Detectar sazonalidade
        const sazonalidade = this.detectSeasonality(historicalSales, previsoes);

        // Calcular confiança baseada na qualidade dos dados
        const confianca = this.calculateConfidence(historicalSales.length, coefficientOfVariation);

        // Gerar recomendações
        const recomendacoes = this.generateRecommendations(
            avgDailySales,
            tendencia,
            sazonalidade,
            confianca
        );

        const executionTime = Date.now() - startTime;

        logger.info(this.ENGINE_NAME, 'Previsão de demanda concluída', {
            produtoId: input.produtoId,
            tendencia,
            mediaPrevista: avgDailySales.toFixed(2),
            confianca: (confianca * 100).toFixed(1) + '%',
            executionTime
        });

        return {
            produtoId: input.produtoId,
            unidadeId: input.unidadeId,
            previsoes,
            confianca,
            tendencia,
            sazonalidade,
            metricas: {
                mediaDiaria: avgDailySales,
                desvioPadrao: stdDev,
                coeficienteVariacao: coefficientOfVariation,
                totalPrevisto: previsoes.reduce((sum, p) => sum + p.quantidadeEsperada, 0)
            },
            recomendacoes
        };
    }

    /**
     * Detecta padrão semanal de vendas
     */
    private detectWeeklyPattern(sales: SalesRecord[]): { [key: string]: number } {
        const dayTotals: { [key: number]: { sum: number; count: number } } = {};

        sales.forEach(sale => {
            const dayOfWeek = sale.data.getDay();
            if (!dayTotals[dayOfWeek]) {
                dayTotals[dayOfWeek] = { sum: 0, count: 0 };
            }
            dayTotals[dayOfWeek].sum += sale.quantidade;
            dayTotals[dayOfWeek].count++;
        });

        // Calcular média por dia da semana
        const dayAverages: { [key: number]: number } = {};
        Object.keys(dayTotals).forEach(day => {
            const dayNum = parseInt(day);
            dayAverages[dayNum] = dayTotals[dayNum].sum / dayTotals[dayNum].count;
        });

        // Normalizar para multiplicadores
        const overallAvg = Object.values(dayAverages).reduce((a, b) => a + b, 0) / Object.values(dayAverages).length;
        const pattern: { [key: string]: number } = {};

        Object.keys(dayAverages).forEach(day => {
            pattern[day] = dayAverages[parseInt(day)] / overallAvg;
        });

        logger.debug(this.ENGINE_NAME, 'Padrão semanal detectado', { pattern });

        return pattern;
    }

    /**
     * Gera previsões para os próximos dias
     */
    private generateForecasts(
        days: number,
        avgSales: number,
        stdDev: number,
        weeklyPattern: { [key: string]: number }
    ): DailyDemand[] {
        const forecasts: DailyDemand[] = [];
        const today = new Date();

        for (let i = 1; i <= days; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i);

            const dayOfWeek = futureDate.getDay();
            const weeklyMultiplier = weeklyPattern[dayOfWeek] || 1.0;

            // Aplicar padrão semanal + pequena variação aleatória
            const randomVariation = 1 + (Math.random() * 0.2 - 0.1); // ±10%
            const expectedQty = Math.round(avgSales * weeklyMultiplier * randomVariation);

            // Intervalo de confiança baseado no desvio padrão
            const confidenceInterval = stdDev * 1.96; // 95% de confiança

            forecasts.push({
                data: futureDate,
                quantidadeEsperada: Math.max(0, expectedQty),
                intervaloConfianca: {
                    min: Math.max(0, Math.round(expectedQty - confidenceInterval)),
                    max: Math.round(expectedQty + confidenceInterval)
                }
            });
        }

        return forecasts;
    }

    /**
     * Detecta tendência nas previsões
     */
    private detectTrend(forecasts: DailyDemand[]): 'CRESCENTE' | 'ESTAVEL' | 'DECRESCENTE' {
        if (forecasts.length < 4) {
            return 'ESTAVEL';
        }

        const midPoint = Math.floor(forecasts.length / 2);
        const firstHalf = forecasts.slice(0, midPoint);
        const secondHalf = forecasts.slice(midPoint);

        const avgFirst = firstHalf.reduce((sum, f) => sum + f.quantidadeEsperada, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((sum, f) => sum + f.quantidadeEsperada, 0) / secondHalf.length;

        if (avgSecond > avgFirst * 1.1) {
            return 'CRESCENTE';
        } else if (avgSecond < avgFirst * 0.9) {
            return 'DECRESCENTE';
        } else {
            return 'ESTAVEL';
        }
    }

    /**
     * Detecta padrões de sazonalidade
     */
    private detectSeasonality(historical: SalesRecord[], forecasts: DailyDemand[]): SeasonalityPattern {
        // Mock: análise simplificada de sazonalidade
        const allQuantities = historical.map(s => s.quantidade);
        const avg = allQuantities.reduce((a, b) => a + b, 0) / allQuantities.length;
        const variance = allQuantities.reduce((sum, q) => sum + Math.pow(q - avg, 2), 0) / allQuantities.length;

        // Score de sazonalidade baseado na variância
        const seasonalityScore = Math.min(1, variance / (avg * avg));

        return {
            score: seasonalityScore,
            picos: [], // TODO: Implementar detecção de picos
            vales: [], // TODO: Implementar detecção de vales
            padraoSemanal: this.detectWeeklyPattern(historical)
        };
    }

    /**
     * Calcula nível de confiança da previsão
     */
    private calculateConfidence(dataPoints: number, coefficientOfVariation: number): number {
        // Confiança baseada em quantidade de dados e estabilidade
        let confidence = 0.5;

        // Mais dados = mais confiança
        if (dataPoints >= 30) confidence += 0.3;
        else if (dataPoints >= 14) confidence += 0.2;
        else if (dataPoints >= 7) confidence += 0.1;

        // Menor variação = mais confiança
        if (coefficientOfVariation < 0.3) confidence += 0.2;
        else if (coefficientOfVariation < 0.5) confidence += 0.1;

        return Math.min(1, confidence);
    }

    /**
     * Gera recomendações baseadas na análise
     */
    private generateRecommendations(
        avgDailySales: number,
        trend: string,
        seasonality: SeasonalityPattern,
        confidence: number
    ): string[] {
        const recommendations: string[] = [];

        recommendations.push(`Demanda média prevista: ${avgDailySales.toFixed(1)} unidades/dia`);
        recommendations.push(`Tendência identificada: ${trend}`);

        if (confidence > 0.7) {
            recommendations.push(`Alta confiança na previsão (${(confidence * 100).toFixed(0)}%)`);
        } else if (confidence < 0.5) {
            recommendations.push(`Baixa confiança - recomenda-se coletar mais dados históricos`);
        }

        const weeklyStock = Math.ceil(avgDailySales * 7 * 1.2); // +20% margem de segurança
        recommendations.push(`Estoque recomendado para 7 dias: ${weeklyStock} unidades`);

        if (trend === 'CRESCENTE') {
            recommendations.push(`Demanda em crescimento - considere aumentar pedidos em 15-20%`);
        } else if (trend === 'DECRESCENTE') {
            recommendations.push(`Demanda em queda - ajuste pedidos para evitar excesso de estoque`);
        }

        if (seasonality.score > 0.6) {
            recommendations.push(`Produto com alta sazonalidade - planeje estoque com antecedência`);
        }

        return recommendations;
    }
}
