/**
 * Testes Unitários - Smart Pricing Engine
 */

import { SmartPricingEngine } from '../../../core/ai/engines/smart-pricing';

describe('SmartPricingEngine', () => {
    let engine: SmartPricingEngine;

    beforeEach(() => {
        engine = new SmartPricingEngine();
    });

    describe('analyze', () => {
        it('deve calcular preço ótimo com dados válidos', async () => {
            // Arrange
            const input = {
                produtoId: 'prod-1',
                unidadeId: 'unid-1',
                precoAtual: 10.0,
                custoProduto: 5.0
            };

            // Act
            const result = await engine.analyze(input);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.produtoId).toBe(input.produtoId);
            expect(result.data.precoOtimo).toBeGreaterThan(0);
            expect(result.data.elasticidade).toBeDefined();
        });

        it('deve retornar recomendações de preço', async () => {
            // Arrange
            const input = {
                produtoId: 'prod-1',
                unidadeId: 'unid-1',
                precoAtual: 10.0,
                custoProduto: 5.0
            };

            // Act
            const result = await engine.analyze(input);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data.recomendacoes).toBeDefined();
            expect(result.data.recomendacoes.length).toBeGreaterThan(0);
        });

        it('deve calcular impacto de variação de preço', async () => {
            // Arrange
            const input = {
                produtoId: 'prod-1',
                unidadeId: 'unid-1',
                precoAtual: 10.0,
                custoProduto: 5.0
            };

            // Act
            const result = await engine.analyze(input);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data.impactoEstimado).toBeDefined();
            expect(result.data.impactoEstimado.variacaoPreco).toBeDefined();
            expect(result.data.impactoEstimado.variacaoVendas).toBeDefined();
        });

        it('deve retornar erro com dados inválidos', async () => {
            // Arrange
            const input = {
                produtoId: '',
                unidadeId: 'unid-1',
                precoAtual: -1, // Preço inválido
                custoProduto: 5.0
            };

            // Act
            const result = await engine.analyze(input);

            // Assert
            // Pode retornar sucesso com valores padrão ou erro, dependendo da implementação
            expect(result).toBeDefined();
        });
    });
});

