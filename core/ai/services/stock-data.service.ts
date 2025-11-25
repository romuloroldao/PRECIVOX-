/**
 * Stock Data Service - Serviço para acesso a dados de estoque
 */

import { prisma } from '../../../lib/prisma';
import { logger } from '../utils/logger';
import { ProductData, StockRecord } from '../types/common';

export class StockDataService {
    /**
     * Busca dados de estoque para uma unidade específica
     */
    async getStockByUnidade(unidadeId: string): Promise<ProductData[]> {
        const startTime = Date.now();

        try {
            logger.info('StockDataService', 'Buscando estoque da unidade', { unidadeId });

            const estoques = await prisma.estoques.findMany({
                where: {
                    unidadeId,
                    disponivel: true
                },
                include: {
                    produtos: true,
                    unidades: {
                        select: {
                            mercadoId: true
                        }
                    }
                }
            });

            const productData: ProductData[] = estoques.map((estoque: any) => ({
                id: estoque.produtos.id,
                nome: estoque.produtos.nome,
                categoria: estoque.produtos.categoria,
                marca: estoque.produtos.marca,
                preco: Number(estoque.preco),
                precoPromocional: estoque.precoPromocional ? Number(estoque.precoPromocional) : null,
                quantidade: estoque.quantidade,
                unidadeId: estoque.unidadeId,
                mercadoId: estoque.unidades.mercadoId,
                codigoBarras: estoque.produtos.codigoBarras,
                unidadeMedida: estoque.produtos.unidadeMedida
            }));

            const executionTime = Date.now() - startTime;
            logger.info('StockDataService', 'Estoque carregado com sucesso', {
                unidadeId,
                totalProdutos: productData.length,
                executionTime
            });

            return productData;
        } catch (error: any) {
            logger.error('StockDataService', 'Erro ao carregar estoque', {
                unidadeId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Busca dados de um produto específico em uma unidade
     */
    async getProductStock(produtoId: string, unidadeId: string): Promise<ProductData | null> {
        try {
            logger.debug('StockDataService', 'Buscando produto específico', { produtoId, unidadeId });

            const estoque = await prisma.estoques.findUnique({
                where: {
                    unidadeId_produtoId: {
                        unidadeId,
                        produtoId
                    }
                },
                include: {
                    produtos: true,
                    unidades: {
                        select: {
                            mercadoId: true
                        }
                    }
                }
            });

            if (!estoque) {
                return null;
            }

            return {
                id: estoque.produtos.id,
                nome: estoque.produtos.nome,
                categoria: estoque.produtos.categoria,
                marca: estoque.produtos.marca,
                preco: Number(estoque.preco),
                precoPromocional: estoque.precoPromocional ? Number(estoque.precoPromocional) : null,
                quantidade: estoque.quantidade,
                unidadeId: estoque.unidadeId,
                mercadoId: estoque.unidades.mercadoId,
                codigoBarras: estoque.produtos.codigoBarras,
                unidadeMedida: estoque.produtos.unidadeMedida
            };
        } catch (error: any) {
            logger.error('StockDataService', 'Erro ao buscar produto', {
                produtoId,
                unidadeId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Busca histórico de movimentação de estoque (MOCK - será implementado)
     * TODO: Criar tabela de movimentações no banco
     */
    async getStockHistory(produtoId: string, unidadeId: string, days: number = 30): Promise<StockRecord[]> {
        logger.warn('StockDataService', 'getStockHistory retornando dados MOCK - implementar tabela de movimentações');

        // Mock: gerar dados aleatórios de movimentação
        const history: StockRecord[] = [];
        const today = new Date();

        for (let i = days; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);

            // Simular 1-3 movimentações por dia
            const movimentacoesDia = Math.floor(Math.random() * 3) + 1;

            for (let j = 0; j < movimentacoesDia; j++) {
                history.push({
                    data: date,
                    quantidade: Math.floor(Math.random() * 20) + 5,
                    movimentacao: Math.random() > 0.5 ? 'ENTRADA' : 'SAIDA'
                });
            }
        }

        return history;
    }

    /**
     * Busca estoque de múltiplas unidades para comparação
     */
    async getStockByMercado(mercadoId: string): Promise<Map<string, ProductData[]>> {
        const startTime = Date.now();

        try {
            logger.info('StockDataService', 'Buscando estoque do mercado', { mercadoId });

            const unidades = await prisma.unidades.findMany({
                where: { mercadoId, ativa: true },
                select: { id: true }
            });

            const stockByUnidade = new Map<string, ProductData[]>();

            for (const unidade of unidades) {
                const stock = await this.getStockByUnidade(unidade.id);
                stockByUnidade.set(unidade.id, stock);
            }

            const executionTime = Date.now() - startTime;
            logger.info('StockDataService', 'Estoque do mercado carregado', {
                mercadoId,
                totalUnidades: unidades.length,
                executionTime
            });

            return stockByUnidade;
        } catch (error: any) {
            logger.error('StockDataService', 'Erro ao carregar estoque do mercado', {
                mercadoId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Atualiza campos de IA no produto
     */
    async updateProductAIFields(produtoId: string, fields: {
        giroEstoqueMedio?: number;
        elasticidadePreco?: number;
        demandaPrevista7d?: number;
        demandaPrevista30d?: number;
        pontoReposicao?: number;
        margemContribuicao?: number;
        scoreSazonalidade?: number;
        categoriaABC?: string;
    }) {
        try {
            await prisma.produtos.update({
                where: { id: produtoId },
                data: {
                    ...fields,
                    ultimaAtualizacaoIA: new Date()
                }
            });

            logger.info('StockDataService', 'Campos de IA atualizados', { produtoId, fields });
        } catch (error: any) {
            logger.error('StockDataService', 'Erro ao atualizar campos de IA', {
                produtoId,
                error: error.message
            });
            throw error;
        }
    }
}
