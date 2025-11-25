/**
 * Demand Predictor Engine - Main Entry Point
 */

import { DemandCalculator } from './calculator';
import { DemandPredictionInput, DemandPredictionOutput } from './types';
import { SalesDataService } from '../../services/sales-data.service';
import { StockDataService } from '../../services/stock-data.service';
import { logger } from '../../utils/logger';
import { metricsCollector } from '../../utils/metrics';
import { AIEngineResult } from '../../types/common';

export class DemandPredictor {
    private calculator: DemandCalculator;
    private salesService: SalesDataService;
    private stockService: StockDataService;
    private readonly ENGINE_NAME = 'DemandPredictor';
    private readonly VERSION = '1.0.0-mock';

    constructor() {
        this.calculator = new DemandCalculator();
        this.salesService = new SalesDataService();
        this.stockService = new StockDataService();
    }

    /**
     * Executa previsão de demanda para um produto
     */
    async predict(input: DemandPredictionInput): Promise<AIEngineResult<DemandPredictionOutput>> {
        const startTime = Date.now();

        try {
            logger.info(this.ENGINE_NAME, 'Iniciando previsão de demanda', {
                produtoId: input.produtoId,
                unidadeId: input.unidadeId
            });

            // Buscar dados históricos de vendas
            const salesHistory = await this.salesService.getSalesHistory(
                input.produtoId,
                input.unidadeId,
                input.periodoHistorico
            );

            // Executar cálculo
            const result = await this.calculator.calculate(input, salesHistory);

            // Atualizar campos de IA no produto
            await this.stockService.updateProductAIFields(input.produtoId, {
                demandaPrevista7d: result.previsoes.slice(0, 7).reduce((sum, p) => sum + p.quantidadeEsperada, 0),
                demandaPrevista30d: result.previsoes.reduce((sum, p) => sum + p.quantidadeEsperada, 0)
            });

            const executionTime = Date.now() - startTime;

            // Registrar métricas
            metricsCollector.record(this.ENGINE_NAME, {
                executionTime,
                itemsProcessed: 1,
                successRate: 1.0
            });

            logger.info(this.ENGINE_NAME, 'Previsão concluída com sucesso', {
                produtoId: input.produtoId,
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

            logger.error(this.ENGINE_NAME, 'Erro ao executar previsão', {
                produtoId: input.produtoId,
                error: error.message,
                stack: error.stack
            });

            // Registrar métrica de falha
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

    /**
     * Executa previsão em lote para múltiplos produtos
     */
    async predictBatch(inputs: DemandPredictionInput[]): Promise<AIEngineResult<DemandPredictionOutput>[]> {
        logger.info(this.ENGINE_NAME, 'Iniciando previsão em lote', {
            totalProdutos: inputs.length
        });

        const results = await Promise.all(
            inputs.map(input => this.predict(input))
        );

        const successCount = results.filter(r => r.success).length;
        logger.info(this.ENGINE_NAME, 'Previsão em lote concluída', {
            total: inputs.length,
            sucesso: successCount,
            falhas: inputs.length - successCount
        });

        return results;
    }
}

// Export types
export * from './types';
