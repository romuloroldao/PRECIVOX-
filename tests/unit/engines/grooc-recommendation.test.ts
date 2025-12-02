/**
 * Testes Unitários - GROOC Recommendation Engine
 */

import { GROOCRecommendationEngine } from '../../../core/ai/engines/grooc-recommendation';
import { StockDataService } from '../../../core/ai/services/stock-data.service';
import { ProductData } from '../../../core/ai/types/common';

// Mock do serviço
jest.mock('../../../core/ai/services/stock-data.service');

describe('GROOCRecommendationEngine', () => {
    let engine: GROOCRecommendationEngine;
    let mockStockService: jest.Mocked<StockDataService>;

    beforeEach(() => {
        mockStockService = new StockDataService() as jest.Mocked<StockDataService>;
        engine = new GROOCRecommendationEngine();
        (engine as any).stockService = mockStockService;
    });

    describe('recommend', () => {
        it('deve gerar recomendações com produtos disponíveis', async () => {
            // Arrange
            const input = {
                produtos: [
                    {
                        nome: 'Arroz',
                        quantidade: 1,
                        categoria: 'Alimentos'
                    }
                ],
                mercadoId: 'merc-1'
            };

            const mockStockData: ProductData[] = [
                {
                    id: 'prod-1',
                    nome: 'Arroz Tipo 1',
                    categoria: 'Alimentos',
                    marca: 'Marca A',
                    preco: 8.0,
                    quantidade: 50,
                    unidadeId: 'unid-1',
                    mercadoId: 'merc-1',
                    codigoBarras: '123456',
                    unidadeMedida: 'KG'
                }
            ];

            const stockMap = new Map([['unid-1', mockStockData]]);
            mockStockService.getStockByMercado.mockResolvedValue(stockMap);

            // Act
            const result = await engine.recommend(input);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.recomendacoes).toBeDefined();
            expect(mockStockService.getStockByMercado).toHaveBeenCalledWith('merc-1');
        });

        it('deve filtrar por unidade quando unidadeId fornecido', async () => {
            // Arrange
            const input = {
                produtos: [
                    {
                        nome: 'Arroz',
                        quantidade: 1
                    }
                ],
                mercadoId: 'merc-1',
                unidadeId: 'unid-1'
            };

            const mockStockData: ProductData[] = [
                {
                    id: 'prod-1',
                    nome: 'Arroz Tipo 1',
                    categoria: 'Alimentos',
                    marca: 'Marca A',
                    preco: 8.0,
                    quantidade: 50,
                    unidadeId: 'unid-1',
                    mercadoId: 'merc-1',
                    codigoBarras: '123456',
                    unidadeMedida: 'KG'
                }
            ];

            mockStockService.getStockByUnidade.mockResolvedValue(mockStockData);

            // Act
            const result = await engine.recommend(input);

            // Assert
            expect(result.success).toBe(true);
            expect(mockStockService.getStockByUnidade).toHaveBeenCalledWith('unid-1');
        });

        it('deve lidar com nenhum produto disponível', async () => {
            // Arrange
            const input = {
                produtos: [
                    {
                        nome: 'Produto Inexistente',
                        quantidade: 1
                    }
                ],
                mercadoId: 'merc-1'
            };

            const stockMap = new Map();
            mockStockService.getStockByMercado.mockResolvedValue(stockMap);

            // Act
            const result = await engine.recommend(input);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Nenhum produto disponível');
        });

        it('deve considerar preferências do usuário', async () => {
            // Arrange
            const input = {
                produtos: [
                    {
                        nome: 'Arroz',
                        quantidade: 1
                    }
                ],
                preferencias: {
                    prefereMenorPreco: true,
                    prefereMenorDistancia: false,
                    opcoesSaudaveis: true,
                    aceitaSubstitutos: true
                },
                mercadoId: 'merc-1'
            };

            const mockStockData: ProductData[] = [
                {
                    id: 'prod-1',
                    nome: 'Arroz Integral',
                    categoria: 'Alimentos',
                    marca: 'Marca A',
                    preco: 9.0,
                    quantidade: 50,
                    unidadeId: 'unid-1',
                    mercadoId: 'merc-1',
                    codigoBarras: '123456',
                    unidadeMedida: 'KG'
                }
            ];

            const stockMap = new Map([['unid-1', mockStockData]]);
            mockStockService.getStockByMercado.mockResolvedValue(stockMap);

            // Act
            const result = await engine.recommend(input);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data.recomendacoes.length).toBeGreaterThan(0);
        });
    });
});

