/**
 * Testes Unitários - Stock Health Engine
 */

import { StockHealthEngine } from '../../../core/ai/engines/stock-health';
import { StockDataService } from '../../../core/ai/services/stock-data.service';
import { ProductData } from '../../../core/ai/types/common';

// Mock do serviço
jest.mock('../../../core/ai/services/stock-data.service');
jest.mock('../../../core/ai/lib/prisma-compat', () => ({
    prisma: {
        alertas_ia: {
            deleteMany: jest.fn(),
            createMany: jest.fn()
        }
    }
}));

describe('StockHealthEngine', () => {
    let engine: StockHealthEngine;
    let mockStockService: jest.Mocked<StockDataService>;

    beforeEach(() => {
        mockStockService = new StockDataService() as jest.Mocked<StockDataService>;
        engine = new StockHealthEngine();
        (engine as any).stockService = mockStockService;
    });

    describe('analyze', () => {
        it('deve analisar saúde do estoque com produtos saudáveis', async () => {
            // Arrange
            const input = {
                unidadeId: 'unid-1',
                mercadoId: 'merc-1',
                categorias: undefined,
                incluirInativos: false
            };

            const mockStockData: ProductData[] = [
                {
                    id: 'prod-1',
                    nome: 'Produto 1',
                    categoria: 'Alimentos',
                    marca: 'Marca A',
                    preco: 10.0,
                    quantidade: 50,
                    unidadeId: 'unid-1',
                    mercadoId: 'merc-1',
                    codigoBarras: '123456',
                    unidadeMedida: 'UN'
                },
                {
                    id: 'prod-2',
                    nome: 'Produto 2',
                    categoria: 'Bebidas',
                    marca: 'Marca B',
                    preco: 15.0,
                    quantidade: 30,
                    unidadeId: 'unid-1',
                    mercadoId: 'merc-1',
                    codigoBarras: '789012',
                    unidadeMedida: 'UN'
                }
            ];

            mockStockService.getStockByUnidade.mockResolvedValue(mockStockData);

            // Act
            const result = await engine.analyze(input);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.unidadeId).toBe(input.unidadeId);
            expect(result.data.score).toBeGreaterThanOrEqual(0);
            expect(result.data.score).toBeLessThanOrEqual(100);
            expect(mockStockService.getStockByUnidade).toHaveBeenCalledWith(input.unidadeId);
        });

        it('deve identificar produtos em ruptura', async () => {
            // Arrange
            const input = {
                unidadeId: 'unid-1',
                mercadoId: 'merc-1'
            };

            const mockStockData: ProductData[] = [
                {
                    id: 'prod-1',
                    nome: 'Produto Ruptura',
                    categoria: 'Alimentos',
                    marca: 'Marca A',
                    preco: 10.0,
                    quantidade: 0, // Ruptura
                    unidadeId: 'unid-1',
                    mercadoId: 'merc-1',
                    codigoBarras: '123456',
                    unidadeMedida: 'UN'
                }
            ];

            mockStockService.getStockByUnidade.mockResolvedValue(mockStockData);

            // Act
            const result = await engine.analyze(input);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data.alertas.length).toBeGreaterThan(0);
            expect(result.data.alertas.some(a => a.tipo === 'RUPTURA')).toBe(true);
        });

        it('deve lidar com estoque vazio', async () => {
            // Arrange
            const input = {
                unidadeId: 'unid-1',
                mercadoId: 'merc-1'
            };

            mockStockService.getStockByUnidade.mockResolvedValue([]);

            // Act
            const result = await engine.analyze(input);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });

        it('deve retornar erro quando serviço falha', async () => {
            // Arrange
            const input = {
                unidadeId: 'unid-1',
                mercadoId: 'merc-1'
            };

            mockStockService.getStockByUnidade.mockRejectedValue(new Error('Erro ao buscar estoque'));

            // Act
            const result = await engine.analyze(input);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });
});

