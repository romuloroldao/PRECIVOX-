/**
 * Sales Data Service - Serviço para acesso a dados de vendas
 */

import { prisma } from '../lib/prisma-compat';
import { logger } from '../utils/logger';
import { SalesRecord } from '../types/common';

export class SalesDataService {
    /**
     * Busca histórico de vendas de um produto (DADOS REAIS)
     */
    async getSalesHistory(produtoId: string, unidadeId: string, days: number = 30): Promise<SalesRecord[]> {
        const startTime = Date.now();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        try {
            logger.info('SalesDataService', 'Buscando histórico de vendas real', {
                produtoId,
                unidadeId,
                days,
                cutoffDate
            });

            // Buscar vendas reais do banco de dados
            const vendas = await prisma.vendas.findMany({
                where: {
                    produtoId,
                    unidadeId,
                    dataVenda: {
                        gte: cutoffDate
                    }
                },
                orderBy: {
                    dataVenda: 'asc'
                }
            });

            // Agrupar vendas por data (pode haver múltiplas vendas no mesmo dia)
            const salesByDate = new Map<string, { quantidade: number; valor: number }>();

            vendas.forEach(venda => {
                const dateKey = venda.dataVenda.toISOString().split('T')[0];
                const existing = salesByDate.get(dateKey) || { quantidade: 0, valor: 0 };
                salesByDate.set(dateKey, {
                    quantidade: existing.quantidade + venda.quantidade,
                    valor: existing.valor + Number(venda.precoTotal)
                });
            });

            // Converter para formato SalesRecord
            const sales: SalesRecord[] = Array.from(salesByDate.entries()).map(([dateStr, data]) => ({
                data: new Date(dateStr),
                quantidade: data.quantidade,
                valor: data.valor
            }));

            // Preencher dias sem vendas com zero (opcional, para análise mais precisa)
            const filledSales: SalesRecord[] = [];
            for (let i = 0; i <= days; i++) {
                const date = new Date(cutoffDate);
                date.setDate(cutoffDate.getDate() + i);
                const dateKey = date.toISOString().split('T')[0];
                
                const sale = sales.find(s => s.data.toISOString().split('T')[0] === dateKey);
                filledSales.push(sale || {
                    data: date,
                    quantidade: 0,
                    valor: 0
                });
            }

            const executionTime = Date.now() - startTime;
            logger.info('SalesDataService', 'Histórico de vendas carregado (REAL)', {
                produtoId,
                unidadeId,
                days,
                totalRecords: filledSales.length,
                vendasEncontradas: vendas.length,
                executionTime
            });

            return filledSales;
        } catch (error: any) {
            logger.error('SalesDataService', 'Erro ao buscar histórico de vendas', {
                produtoId,
                unidadeId,
                error: error.message
            });
            // Retornar array vazio em caso de erro
            return [];
        }
    }

    /**
     * Calcula média de vendas diárias
     */
    async getAverageDailySales(produtoId: string, unidadeId: string, days: number = 30): Promise<number> {
        const sales = await this.getSalesHistory(produtoId, unidadeId, days);

        if (sales.length === 0) {
            return 0;
        }

        const totalQuantity = sales.reduce((sum, sale) => sum + sale.quantidade, 0);
        const average = totalQuantity / sales.length;

        logger.debug('SalesDataService', 'Média de vendas calculada', {
            produtoId,
            unidadeId,
            average,
            totalDays: sales.length
        });

        return average;
    }

    /**
     * Identifica tendência de vendas
     */
    async getSalesTrend(produtoId: string, unidadeId: string, days: number = 30): Promise<'CRESCENTE' | 'ESTAVEL' | 'DECRESCENTE'> {
        const sales = await this.getSalesHistory(produtoId, unidadeId, days);

        if (sales.length < 7) {
            return 'ESTAVEL';
        }

        // Comparar primeira metade com segunda metade
        const midPoint = Math.floor(sales.length / 2);
        const firstHalf = sales.slice(0, midPoint);
        const secondHalf = sales.slice(midPoint);

        const avgFirst = firstHalf.reduce((sum, s) => sum + s.quantidade, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((sum, s) => sum + s.quantidade, 0) / secondHalf.length;

        let trend: 'CRESCENTE' | 'ESTAVEL' | 'DECRESCENTE';

        if (avgSecond > avgFirst * 1.15) {
            trend = 'CRESCENTE';
        } else if (avgSecond < avgFirst * 0.85) {
            trend = 'DECRESCENTE';
        } else {
            trend = 'ESTAVEL';
        }

        logger.debug('SalesDataService', 'Tendência de vendas identificada', {
            produtoId,
            unidadeId,
            trend,
            avgFirst,
            avgSecond
        });

        return trend;
    }

    /**
     * Calcula elasticidade de preço (DADOS REAIS)
     * Baseado em variações históricas de preço e quantidade vendida
     */
    async getPriceElasticity(produtoId: string, unidadeId: string): Promise<number> {
        const startTime = Date.now();

        try {
            logger.info('SalesDataService', 'Calculando elasticidade de preço (REAL)', {
                produtoId,
                unidadeId
            });

            // Buscar histórico de vendas e preços dos últimos 60 dias
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 60);

            const vendas = await prisma.vendas.findMany({
                where: {
                    produtoId,
                    unidadeId,
                    dataVenda: {
                        gte: cutoffDate
                    }
                },
                orderBy: {
                    dataVenda: 'asc'
                }
            });

            if (vendas.length < 10) {
                logger.warn('SalesDataService', 'Dados insuficientes para calcular elasticidade', {
                    produtoId,
                    vendasEncontradas: vendas.length
                });
                // Retornar elasticidade padrão se não houver dados suficientes
                return -1.2;
            }

            // Agrupar por período de preço (semana)
            const pricePeriods: Array<{ precoMedio: number; quantidadeTotal: number; vendas: number }> = [];
            const currentPeriod: { preco: number[]; quantidade: number; vendas: number } = {
                preco: [],
                quantidade: 0,
                vendas: 0
            };

            vendas.forEach((venda, index) => {
                currentPeriod.preco.push(Number(venda.precoUnitario));
                currentPeriod.quantidade += venda.quantidade;
                currentPeriod.vendas++;

                // Agrupar a cada 7 vendas ou mudança significativa de preço
                if (currentPeriod.vendas >= 7 || index === vendas.length - 1) {
                    const precoMedio = currentPeriod.preco.reduce((a, b) => a + b, 0) / currentPeriod.preco.length;
                    pricePeriods.push({
                        precoMedio,
                        quantidadeTotal: currentPeriod.quantidade,
                        vendas: currentPeriod.vendas
                    });
                    currentPeriod.preco = [];
                    currentPeriod.quantidade = 0;
                    currentPeriod.vendas = 0;
                }
            });

            if (pricePeriods.length < 2) {
                return -1.2; // Elasticidade padrão
            }

            // Calcular elasticidade usando variação percentual média
            let totalElasticity = 0;
            let validCalculations = 0;

            for (let i = 1; i < pricePeriods.length; i++) {
                const prev = pricePeriods[i - 1];
                const curr = pricePeriods[i];

                const priceChange = (curr.precoMedio - prev.precoMedio) / prev.precoMedio;
                const quantityChange = (curr.quantidadeTotal - prev.quantidadeTotal) / prev.quantidadeTotal;

                if (Math.abs(priceChange) > 0.01) { // Ignorar mudanças muito pequenas
                    const elasticity = quantityChange / priceChange;
                    if (isFinite(elasticity) && elasticity < 0) { // Elasticidade deve ser negativa
                        totalElasticity += elasticity;
                        validCalculations++;
                    }
                }
            }

            const elasticity = validCalculations > 0 
                ? totalElasticity / validCalculations 
                : -1.2; // Padrão se não conseguir calcular

            // Limitar elasticidade entre -3.0 e -0.1 (valores realistas)
            const clampedElasticity = Math.max(-3.0, Math.min(-0.1, elasticity));

            const executionTime = Date.now() - startTime;
            logger.info('SalesDataService', 'Elasticidade de preço calculada (REAL)', {
                produtoId,
                unidadeId,
                elasticity: clampedElasticity,
                periodosAnalisados: pricePeriods.length,
                calculosValidos: validCalculations,
                executionTime
            });

            return clampedElasticity;
        } catch (error: any) {
            logger.error('SalesDataService', 'Erro ao calcular elasticidade', {
                produtoId,
                unidadeId,
                error: error.message
            });
            // Retornar elasticidade padrão em caso de erro
            return -1.2;
        }
    }

    /**
     * Identifica produtos correlacionados (frequentemente comprados juntos) - DADOS REAIS
     * Baseado em análise de cestas de compras (vendas no mesmo dia/unidade)
     */
    async getCorrelatedProducts(produtoId: string, limit: number = 5): Promise<Array<{ produtoId: string; confianca: number }>> {
        const startTime = Date.now();

        try {
            logger.info('SalesDataService', 'Buscando produtos correlacionados (REAL)', {
                produtoId,
                limit
            });

            // Buscar todas as vendas do produto nos últimos 90 dias
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 90);

            const vendasProduto = await prisma.vendas.findMany({
                where: {
                    produtoId,
                    dataVenda: {
                        gte: cutoffDate
                    }
                },
                select: {
                    unidadeId: true,
                    dataVenda: true
                },
                distinct: ['unidadeId', 'dataVenda']
            });

            if (vendasProduto.length === 0) {
                logger.warn('SalesDataService', 'Nenhuma venda encontrada para análise de correlação', {
                    produtoId
                });
                return [];
            }

            // Para cada venda, buscar outros produtos vendidos no mesmo dia/unidade
            const productCounts = new Map<string, number>();
            const totalBaskets = vendasProduto.length;

            for (const venda of vendasProduto) {
                const startOfDay = new Date(venda.dataVenda);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(venda.dataVenda);
                endOfDay.setHours(23, 59, 59, 999);

                const vendasMesmoDia = await prisma.vendas.findMany({
                    where: {
                        unidadeId: venda.unidadeId,
                        dataVenda: {
                            gte: startOfDay,
                            lte: endOfDay
                        },
                        produtoId: {
                            not: produtoId // Excluir o próprio produto
                        }
                    },
                    select: {
                        produtoId: true
                    },
                    distinct: ['produtoId']
                });

                vendasMesmoDia.forEach(v => {
                    const count = productCounts.get(v.produtoId) || 0;
                    productCounts.set(v.produtoId, count + 1);
                });
            }

            // Calcular confiança (suporte: quantas vezes apareceu junto / total de cestas)
            const correlations = Array.from(productCounts.entries())
                .map(([prodId, count]) => ({
                    produtoId: prodId,
                    confianca: count / totalBaskets
                }))
                .sort((a, b) => b.confianca - a.confianca)
                .slice(0, limit);

            const executionTime = Date.now() - startTime;
            logger.info('SalesDataService', 'Produtos correlacionados encontrados (REAL)', {
                produtoId,
                totalCorrelacoes: correlations.length,
                cestasAnalisadas: totalBaskets,
                executionTime
            });

            return correlations;
        } catch (error: any) {
            logger.error('SalesDataService', 'Erro ao buscar produtos correlacionados', {
                produtoId,
                error: error.message
            });
            return [];
        }
    }
}
