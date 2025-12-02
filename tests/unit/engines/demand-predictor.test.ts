/**
 * Testes Unitários - Demand Predictor Engine
 */

import { DemandPredictor } from '../../../core/ai/engines/demand-predictor';
import { SalesDataService } from '../../../core/ai/services/sales-data.service';
import { StockDataService } from '../../../core/ai/services/stock-data.service';
import { SalesRecord } from '../../../core/ai/types/common';

// Mock dos serviços
jest.mock('../../../core/ai/services/sales-data.service');
jest.mock('../../../core/ai/services/stock-data.service');

describe('DemandPredictor', () => {
    let predictor: DemandPredictor;
    let mockSalesService: jest.Mocked<SalesDataService>;
    let mockStockService: jest.Mocked<StockDataService>;

    beforeEach(() => {
        mockSalesService = new SalesDataService() as jest.Mocked<SalesDataService>;
        mockStockService = new StockDataService() as jest.Mocked<StockDataService>;
        predictor = new DemandPredictor();
        (predictor as any).salesService = mockSalesService;
        (predictor as any).stockService = mockStockService;
    });

    describe('predict', () => {
        it('deve prever demanda com dados históricos suficientes', async () => {
            // Arrange
            const input = {
                produtoId: 'prod-1',
                unidadeId: 'unid-1',
                periodoHistorico: 30,
                periodoPrevisao: 7
            };

            const mockSalesHistory: SalesRecord[] = Array.from({ length: 30 }, (_, i) => ({
                data: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
                quantidade: 10 + Math.floor(Math.random() * 5),
                valor: 100 + Math.random() * 50
            }));

            mockSalesService.getSalesHistory.mockResolvedValue(mockSalesHistory);
            mockStockService.updateProductAIFields.mockResolvedValue();

            // Act
            const result = await predictor.predict(input);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.previsoes).toHaveLength(7);
            expect(mockSalesService.getSalesHistory).toHaveBeenCalledWith(
                input.produtoId,
                input.unidadeId,
                input.periodoHistorico
            );
        });

        it('deve lidar com dados históricos insuficientes', async () => {
            // Arrange
            const input = {
                produtoId: 'prod-1',
                unidadeId: 'unid-1',
                periodoHistorico: 30,
                periodoPrevisao: 7
            };

            const mockSalesHistory: SalesRecord[] = Array.from({ length: 3 }, (_, i) => ({
                data: new Date(Date.now() - (3 - i) * 24 * 60 * 60 * 1000),
                quantidade: 5,
                valor: 50
            }));

            mockSalesService.getSalesHistory.mockResolvedValue(mockSalesHistory);

            // Act
            const result = await predictor.predict(input);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data.previsoes.length).toBeGreaterThan(0);
        });

        it('deve retornar erro quando serviço falha', async () => {
            // Arrange
            const input = {
                produtoId: 'prod-1',
                unidadeId: 'unid-1',
                periodoHistorico: 30,
                periodoPrevisao: 7
            };

            mockSalesService.getSalesHistory.mockRejectedValue(new Error('Erro ao buscar vendas'));

            // Act
            const result = await predictor.predict(input);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('predictBatch', () => {
        it('deve processar múltiplos produtos em lote', async () => {
            // Arrange
            const inputs = [
                {
                    produtoId: 'prod-1',
                    unidadeId: 'unid-1',
                    periodoHistorico: 30,
                    periodoPrevisao: 7
                },
                {
                    produtoId: 'prod-2',
                    unidadeId: 'unid-1',
                    periodoHistorico: 30,
                    periodoPrevisao: 7
                }
            ];

            const mockSalesHistory: SalesRecord[] = Array.from({ length: 30 }, (_, i) => ({
                data: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
                quantidade: 10,
                valor: 100
            }));

            mockSalesService.getSalesHistory.mockResolvedValue(mockSalesHistory);
            mockStockService.updateProductAIFields.mockResolvedValue();

            // Act
            const results = await predictor.predictBatch(inputs);

            // Assert
            expect(results).toHaveLength(2);
            expect(results.every(r => r.success)).toBe(true);
            expect(mockSalesService.getSalesHistory).toHaveBeenCalledTimes(2);
        });
    });
});

