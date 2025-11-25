/**
 * Enhanced GROOC Recommendation Engine - Main Entry Point
 */

import { GROOCRecommender } from './recommender';
import { RecommendationInput, RecommendationOutput } from './types';
import { StockDataService } from '../../services/stock-data.service';
import { logger } from '../../utils/logger';
import { metricsCollector } from '../../utils/metrics';
import { AIEngineResult } from '../../types/common';

export class GROOCRecommendationEngine {
    private recommender: GROOCRecommender;
    private stockService: StockDataService;
    private readonly ENGINE_NAME = 'GROOCEngine';
    private readonly VERSION = '2.0.0-enhanced';

    constructor() {
        this.recommender = new GROOCRecommender();
        this.stockService = new StockDataService();
    }

    /**
     * Gera recomendações inteligentes baseadas em múltiplos critérios
     */
    async recommend(input: RecommendationInput): Promise<AIEngineResult<RecommendationOutput>> {
        const startTime = Date.now();

        try {
            logger.info(this.ENGINE_NAME, 'Iniciando recomendações GROOC', {
                totalProdutos: input.produtos.length,
                temLocalizacao: !!input.localizacaoUsuario,
                temPreferencias: !!input.preferencias,
                temHistorico: !!input.historicoUsuario
            });

            // Buscar produtos disponíveis de todas as unidades do mercado
            // Mock: em produção, buscar do mercado específico do usuário
            const mercadoId = 'mercado-default';
            const stockByUnidade = await this.stockService.getStockByMercado(mercadoId);

            // Consolidar todos os produtos disponíveis
            const allProducts = Array.from(stockByUnidade.values()).flat();

            if (allProducts.length === 0) {
                logger.warn(this.ENGINE_NAME, 'Nenhum produto disponível no mercado');

                return {
                    success: false,
                    error: 'Nenhum produto disponível no momento',
                    metadata: {
                        engineName: this.ENGINE_NAME,
                        executionTime: Date.now() - startTime,
                        timestamp: new Date(),
                        version: this.VERSION
                    }
                };
            }

            // Executar recomendação
            const result = await this.recommender.recommend(input, allProducts);

            const executionTime = Date.now() - startTime;

            // Registrar métricas
            metricsCollector.record(this.ENGINE_NAME, {
                executionTime,
                itemsProcessed: input.produtos.length,
                successRate: 1.0
            });

            logger.info(this.ENGINE_NAME, 'Recomendações geradas com sucesso', {
                totalRecomendacoes: result.recomendacoes.length,
                economiaEstimada: result.economiaEstimada,
                executionTime
            });

            return {
                success: true,
                data: result,
                metadata: {
                    engineName: this.ENGINE_NAME,
                    executionTime,
                    timestamp: new Date(),
                    version: this.VERSION
                }
            };
        } catch (error: any) {
            const executionTime = Date.now() - startTime;

            logger.error(this.ENGINE_NAME, 'Erro ao gerar recomendações', {
                error: error.message,
                stack: error.stack
            });

            metricsCollector.record(this.ENGINE_NAME, {
                executionTime,
                itemsProcessed: 0,
                successRate: 0.0
            });

            return {
                success: false,
                error: error.message,
                metadata: {
                    engineName: this.ENGINE_NAME,
                    executionTime,
                    timestamp: new Date(),
                    version: this.VERSION
                }
            };
        }
    }
}

// Export types
export * from './types';
