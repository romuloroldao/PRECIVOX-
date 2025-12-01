/**
 * Stock Health Engine - Main Entry Point
 */

import { StockHealthAnalyzer } from './analyzer';
import { StockHealthInput, StockHealthOutput } from './types';
import { StockDataService } from '../../services/stock-data.service';
import { logger } from '../../utils/logger';
import { metricsCollector } from '../../utils/metrics';
import { AIEngineResult } from '../../types/common';
import { prisma } from '../../lib/prisma-compat';

export class StockHealthEngine {
    private analyzer: StockHealthAnalyzer;
    private stockService: StockDataService;
    private readonly ENGINE_NAME = 'StockHealthEngine';
    private readonly VERSION = '1.0.0';

    constructor() {
        this.analyzer = new StockHealthAnalyzer();
        this.stockService = new StockDataService();
    }

    /**
     * Analisa saúde do estoque de uma unidade
     */
    async analyze(input: StockHealthInput): Promise<AIEngineResult<StockHealthOutput>> {
        const startTime = Date.now();

        try {
            logger.info(this.ENGINE_NAME, 'Iniciando análise de saúde do estoque', {
                unidadeId: input.unidadeId,
                mercadoId: input.mercadoId
            });

            // Buscar dados de estoque
            const stockData = await this.stockService.getStockByUnidade(input.unidadeId);

            if (stockData.length === 0) {
                logger.warn(this.ENGINE_NAME, 'Nenhum produto encontrado', {
                    unidadeId: input.unidadeId
                });
            }

            // Executar análise
            const result = await this.analyzer.analyze(input, stockData);

            // Salvar alertas no banco de dados
            await this.saveAlerts(input.mercadoId, input.unidadeId, result);

            const executionTime = Date.now() - startTime;

            // Registrar métricas
            metricsCollector.record(this.ENGINE_NAME, {
                executionTime,
                itemsProcessed: stockData.length,
                successRate: 1.0
            });

            logger.info(this.ENGINE_NAME, 'Análise concluída com sucesso', {
                unidadeId: input.unidadeId,
                score: result.score,
                status: result.status,
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

            logger.error(this.ENGINE_NAME, 'Erro ao executar análise', {
                unidadeId: input.unidadeId,
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

    /**
     * Salva alertas gerados no banco de dados
     */
    private async saveAlerts(mercadoId: string, unidadeId: string, analysis: StockHealthOutput) {
        try {
            // Limpar alertas antigos desta unidade
            await prisma.alertas_ia.deleteMany({
                where: {
                    mercadoId,
                    unidadeId,
                    tipo: {
                        in: ['RUPTURA', 'EXCESSO', 'GIRO_BAIXO', 'PRECO_DESATUALIZADO']
                    }
                }
            });

            // Criar novos alertas
            const alertsToCreate = analysis.alertas.slice(0, 20).map(alerta => ({
                id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                mercadoId,
                unidadeId,
                produtoId: alerta.produtoId,
                tipo: alerta.tipo,
                titulo: `${alerta.tipo}: ${alerta.produtoNome}`,
                descricao: alerta.descricao,
                prioridade: alerta.prioridade,
                acaoRecomendada: alerta.acaoRecomendada,
                linkAcao: `/gestor/produtos/${alerta.produtoId}`,
                lido: false,
                metadata: {
                    quantidadeAtual: alerta.quantidadeAtual,
                    quantidadeRecomendada: alerta.quantidadeRecomendada,
                    diasParaRuptura: alerta.diasParaRuptura,
                    valorImpacto: alerta.valorImpacto,
                    urgencia: alerta.urgencia
                },
                criadoEm: new Date(),
                expiradoEm: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
            }));

            if (alertsToCreate.length > 0) {
                await prisma.alertas_ia.createMany({
                    data: alertsToCreate
                });

                logger.info(this.ENGINE_NAME, 'Alertas salvos no banco de dados', {
                    mercadoId,
                    unidadeId,
                    totalAlertas: alertsToCreate.length
                });
            }
        } catch (error: any) {
            logger.error(this.ENGINE_NAME, 'Erro ao salvar alertas', {
                mercadoId,
                unidadeId,
                error: error.message
            });
            // Não propagar erro - análise foi bem sucedida
        }
    }
}

// Export types
export * from './types';
