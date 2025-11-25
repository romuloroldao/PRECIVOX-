/**
 * Sales Data Service - Serviço para acesso a dados de vendas
 */

import { logger } from '../utils/logger';
import { SalesRecord } from '../types/common';

export class SalesDataService {
    /**
     * Busca histórico de vendas de um produto
     * MOCK - Será implementado quando houver tabela de vendas
     * TODO: Criar tabela de vendas no banco de dados
     */
    async getSalesHistory(produtoId: string, unidadeId: string, days: number = 30): Promise<SalesRecord[]> {
        logger.warn('SalesDataService', 'getSalesHistory retornando dados MOCK - implementar tabela de vendas');

        // Mock: gerar vendas aleatórias baseadas em padrões realistas
        const sales: SalesRecord[] = [];
        const today = new Date();

        // Simular padrão semanal (mais vendas no fim de semana)
        for (let i = days; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);

            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            // Multiplicador de vendas (fim de semana vende mais)
            const weekendMultiplier = isWeekend ? 1.5 : 1.0;

            // Quantidade base com variação aleatória
            const baseQuantity = Math.floor(Math.random() * 10) + 5;
            const quantidade = Math.floor(baseQuantity * weekendMultiplier);

            // Preço unitário com pequena variação
            const precoUnitario = 10 + Math.random() * 20;

            sales.push({
                data: date,
                quantidade,
                valor: quantidade * precoUnitario
            });
        }

        logger.debug('SalesDataService', 'Histórico de vendas gerado (MOCK)', {
            produtoId,
            unidadeId,
            days,
            totalRecords: sales.length
        });

        return sales;
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
     * Calcula elasticidade de preço (MOCK)
     * TODO: Implementar cálculo real baseado em variações de preço e vendas
     */
    async getPriceElasticity(produtoId: string, unidadeId: string): Promise<number> {
        logger.warn('SalesDataService', 'getPriceElasticity retornando valor MOCK');

        // Mock: elasticidade típica entre -0.5 e -2.0
        // Valores negativos indicam que aumento de preço reduz demanda
        const elasticity = -(0.5 + Math.random() * 1.5);

        logger.debug('SalesDataService', 'Elasticidade de preço calculada (MOCK)', {
            produtoId,
            unidadeId,
            elasticity
        });

        return elasticity;
    }

    /**
     * Identifica produtos correlacionados (frequentemente comprados juntos)
     * MOCK - Será implementado com análise de cestas de compras
     */
    async getCorrelatedProducts(produtoId: string, limit: number = 5): Promise<Array<{ produtoId: string; confianca: number }>> {
        logger.warn('SalesDataService', 'getCorrelatedProducts retornando dados MOCK');

        // Mock: retornar produtos aleatórios com confiança
        const correlations = [];

        for (let i = 0; i < limit; i++) {
            correlations.push({
                produtoId: `produto-${i}`,
                confianca: 0.5 + Math.random() * 0.4 // 0.5 a 0.9
            });
        }

        return correlations;
    }
}
