/**
 * Smart Pricing Engine - Calculator (DADOS REAIS)
 * Usa elasticidade real calculada a partir de dados históricos
 */

import { PricingAnalysisInput, PricingAnalysisOutput } from './types';
import { logger } from '../../utils/logger';
import { SalesDataService } from '../../services/sales-data.service';
import { StockDataService } from '../../services/stock-data.service';
import { prisma } from '../../lib/prisma-compat';

export class PricingCalculator {
    private readonly ENGINE_NAME = 'SmartPricingEngine';
    private salesService: SalesDataService;
    private stockService: StockDataService;

    constructor() {
        this.salesService = new SalesDataService();
        this.stockService = new StockDataService();
    }

    async calculate(input: PricingAnalysisInput): Promise<PricingAnalysisOutput> {
        logger.info(this.ENGINE_NAME, 'Calculando análise de precificação (REAL)', {
            produtoId: input.produtoId,
            unidadeId: input.unidadeId
        });

        // Buscar elasticidade real do banco ou calcular
        let elasticidade = input.produtoId ? await this.getOrCalculateElasticity(input.produtoId, input.unidadeId) : -1.2;

        // Buscar preço médio do mercado (outras unidades do mesmo mercado)
        const precoMercado = await this.getMarketPrice(input.produtoId, input.unidadeId, input.precoAtual);

        // Calcular preço ótimo baseado em elasticidade e preço de mercado
        const precoOtimo = this.calculateOptimalPrice(input.precoAtual, precoMercado, elasticidade);

        const variacaoPreco = ((precoOtimo - input.precoAtual) / input.precoAtual) * 100;
        const variacaoVendas = -elasticidade * variacaoPreco;
        const variacaoReceita = variacaoPreco + variacaoVendas;

        return {
            produtoId: input.produtoId,
            unidadeId: input.unidadeId,
            elasticidade,
            precoOtimo,
            impactoEstimado: {
                variacaoPreco,
                variacaoVendas,
                variacaoReceita,
                variacaoMargem: variacaoReceita * 0.8
            },
            competitividade: {
                posicao: input.precoAtual < precoMercado * 0.95 ? 'MAIS_BARATO' :
                    input.precoAtual > precoMercado * 1.1 ? 'MAIS_CARO' : 'COMPETITIVO',
                diferencaMedia: ((input.precoAtual - precoMercado) / precoMercado) * 100,
                precoMercado,
                ranking: await this.calculateRanking(input.produtoId, input.unidadeId, input.precoAtual)
            },
            recomendacoes: [
                {
                    tipo: precoOtimo < input.precoAtual ? 'REDUZIR' : 'AUMENTAR',
                    precoSugerido: precoOtimo,
                    justificativa: `Preço ótimo baseado em elasticidade de ${elasticidade.toFixed(2)}`,
                    impactoEsperado: `Aumento estimado de ${variacaoReceita.toFixed(1)}% na receita`,
                    prioridade: 'MEDIA',
                    confianca: 0.7
                }
            ]
        };
    }

    /**
     * Obtém ou calcula elasticidade de preço
     */
    private async getOrCalculateElasticity(produtoId: string, unidadeId: string): Promise<number> {
        try {
            // Tentar buscar do produto primeiro
            const produto = await prisma.produtos.findUnique({
                where: { id: produtoId },
                select: { elasticidadePreco: true }
            });

            if (produto?.elasticidadePreco && produto.elasticidadePreco !== -1.2) {
                return produto.elasticidadePreco;
            }

            // Calcular usando SalesDataService
            return await this.salesService.getPriceElasticity(produtoId, unidadeId);
        } catch (error: any) {
            logger.warn(this.ENGINE_NAME, 'Erro ao obter elasticidade, usando padrão', {
                produtoId,
                error: error.message
            });
            return -1.2;
        }
    }

    /**
     * Calcula preço médio do mercado (outras unidades)
     */
    private async getMarketPrice(produtoId: string, unidadeId: string, precoAtual: number): Promise<number> {
        try {
            // Buscar unidade atual para obter mercadoId
            const unidade = await prisma.unidades.findUnique({
                where: { id: unidadeId },
                select: { mercadoId: true }
            });

            if (!unidade) {
                return precoAtual;
            }

            // Buscar preços do mesmo produto em outras unidades do mercado
            const estoques = await prisma.estoques.findMany({
                where: {
                    produtoId,
                    unidadeId: {
                        not: unidadeId
                    },
                    unidades: {
                        mercadoId: unidade.mercadoId
                    },
                    disponivel: true
                },
                select: {
                    preco: true,
                    precoPromocional: true
                }
            });

            if (estoques.length === 0) {
                return precoAtual;
            }

            // Calcular média de preços (usar promocional se disponível)
            const precos = estoques.map(e => Number(e.precoPromocional || e.preco));
            const precoMedio = precos.reduce((a, b) => a + b, 0) / precos.length;

            return precoMedio;
        } catch (error: any) {
            logger.warn(this.ENGINE_NAME, 'Erro ao calcular preço de mercado, usando preço atual', {
                produtoId,
                error: error.message
            });
            return precoAtual;
        }
    }

    /**
     * Calcula preço ótimo baseado em elasticidade
     */
    private calculateOptimalPrice(precoAtual: number, precoMercado: number, elasticidade: number): number {
        // Se elasticidade é muito alta (produto muito sensível a preço), manter próximo do mercado
        // Se elasticidade é baixa (produto pouco sensível), pode aumentar preço
        const elasticidadeAbs = Math.abs(elasticidade);

        if (elasticidadeAbs > 1.5) {
            // Produto muito sensível - preço deve ser competitivo (5% abaixo do mercado)
            return precoMercado * 0.95;
        } else if (elasticidadeAbs < 0.5) {
            // Produto pouco sensível - pode aumentar até 10% acima do mercado
            return Math.min(precoMercado * 1.1, precoAtual * 1.05);
        } else {
            // Produto com elasticidade média - manter competitivo mas otimizar
            return precoMercado * 0.97;
        }
    }

    /**
     * Calcula ranking de preço (1 = mais barato, 5+ = mais caro)
     */
    private async calculateRanking(produtoId: string, unidadeId: string, precoAtual: number): Promise<number> {
        try {
            const unidade = await prisma.unidades.findUnique({
                where: { id: unidadeId },
                select: { mercadoId: true }
            });

            if (!unidade) {
                return 3; // Ranking médio
            }

            const estoques = await prisma.estoques.findMany({
                where: {
                    produtoId,
                    unidades: {
                        mercadoId: unidade.mercadoId
                    },
                    disponivel: true
                },
                select: {
                    preco: true,
                    precoPromocional: true
                }
            });

            if (estoques.length === 0) {
                return 1; // Único no mercado
            }

            const precos = estoques.map(e => Number(e.precoPromocional || e.preco));
            precos.push(precoAtual);
            precos.sort((a, b) => a - b);

            const ranking = precos.indexOf(precoAtual) + 1;
            return ranking;
        } catch (error: any) {
            logger.warn(this.ENGINE_NAME, 'Erro ao calcular ranking', {
                produtoId,
                error: error.message
            });
            return 3;
        }
    }
}
