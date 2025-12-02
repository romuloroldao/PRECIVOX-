/**
 * Testes de Integração - APIs de IA
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// Mock dos engines compilados
jest.mock('../../dist/ai/engines/demand-predictor', () => ({
    DemandPredictor: jest.fn().mockImplementation(() => ({
        predictBatch: jest.fn().mockResolvedValue([
            {
                success: true,
                data: {
                    previsoes: [
                        { data: new Date(), quantidadeEsperada: 10, confianca: 0.8 }
                    ]
                }
            }
        ])
    }))
}));

jest.mock('../../dist/ai/engines/stock-health', () => ({
    StockHealthEngine: jest.fn().mockImplementation(() => ({
        analyze: jest.fn().mockResolvedValue({
            success: true,
            data: {
                unidadeId: 'unid-1',
                score: 85,
                status: 'SAUDAVEL',
                alertas: [],
                metricas: {
                    giroMedio: 10,
                    taxaRuptura: 5,
                    valorEstoque: 10000
                }
            }
        })
    }))
}));

jest.mock('../../dist/ai/engines/smart-pricing', () => ({
    SmartPricingEngine: jest.fn().mockImplementation(() => ({
        analyze: jest.fn().mockResolvedValue({
            success: true,
            data: {
                produtoId: 'prod-1',
                precoOtimo: 10.0,
                elasticidade: -1.2,
                recomendacoes: []
            }
        })
    }))
}));

jest.mock('../../dist/ai/engines/grooc-recommendation', () => ({
    GROOCRecommendationEngine: jest.fn().mockImplementation(() => ({
        recommend: jest.fn().mockResolvedValue({
            success: true,
            data: {
                recomendacoes: [],
                economiaEstimada: 50
            }
        })
    }))
}));

// Importar rotas após mocks
import aiEnginesRouter from '../../backend/routes/ai-engines';

describe('API de IA - Integração', () => {
    let app: express.Application;
    let token: string;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/api/ai-engines', aiEnginesRouter);
        
        // Gerar token JWT para testes
        token = jwt.sign(
            { id: 'test-user', email: 'test@test.com', role: 'GESTOR' },
            process.env.JWT_SECRET || 'your-secret-key'
        );
    });

    describe('POST /api/ai-engines/demand', () => {
        it('deve retornar previsões de demanda com autenticação válida', async () => {
            const response = await request(app)
                .post('/api/ai-engines/demand')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    mercadoId: 'merc-1',
                    produtos: ['prod-1'],
                    unidadeId: 'unid-1'
                })
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.pagination).toBeDefined();
        });

        it('deve retornar 401 sem token', async () => {
            const response = await request(app)
                .post('/api/ai-engines/demand')
                .send({
                    mercadoId: 'merc-1',
                    produtos: ['prod-1']
                });

            expect(response.status).toBe(401);
        });

        it('deve aplicar paginação corretamente', async () => {
            const response = await request(app)
                .post('/api/ai-engines/demand')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    mercadoId: 'merc-1',
                    produtos: Array.from({ length: 50 }, (_, i) => `prod-${i}`)
                })
                .query({ page: 2, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.pagination.page).toBe(2);
            expect(response.body.pagination.limit).toBe(10);
        });
    });

    describe('POST /api/ai-engines/stock-health', () => {
        it('deve retornar análise de saúde do estoque', async () => {
            const response = await request(app)
                .post('/api/ai-engines/stock-health')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    unidadeId: 'unid-1',
                    mercadoId: 'merc-1'
                })
                .query({ page: 1, limit: 20 });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.score).toBeDefined();
            expect(response.body.pagination).toBeDefined();
        });

        it('deve retornar 400 sem unidadeId ou mercadoId', async () => {
            const response = await request(app)
                .post('/api/ai-engines/stock-health')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(response.status).toBe(400);
        });

        it('deve filtrar por categorias quando fornecido', async () => {
            const response = await request(app)
                .post('/api/ai-engines/stock-health')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    unidadeId: 'unid-1',
                    mercadoId: 'merc-1',
                    categorias: ['Alimentos', 'Bebidas']
                });

            expect(response.status).toBe(200);
        });
    });

    describe('POST /api/ai-engines/pricing', () => {
        it('deve retornar recomendações de preço', async () => {
            const response = await request(app)
                .post('/api/ai-engines/pricing')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    produtoId: 'prod-1',
                    unidadeId: 'unid-1'
                })
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.recommendations).toBeDefined();
        });

        it('deve processar múltiplos produtos com paginação', async () => {
            const response = await request(app)
                .post('/api/ai-engines/pricing')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    produtos: ['prod-1', 'prod-2', 'prod-3'],
                    unidadeId: 'unid-1'
                })
                .query({ page: 1, limit: 2 });

            expect(response.status).toBe(200);
            expect(response.body.pagination.total).toBe(3);
            expect(response.body.data.recommendations.length).toBeLessThanOrEqual(2);
        });
    });

    describe('POST /api/ai-engines/grooc', () => {
        it('deve retornar recomendações GROOC', async () => {
            const response = await request(app)
                .post('/api/ai-engines/grooc')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    produtos: [
                        { nome: 'Arroz', quantidade: 1 }
                    ],
                    mercadoId: 'merc-1'
                })
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.recomendacoes).toBeDefined();
        });

        it('deve filtrar por mercado quando fornecido', async () => {
            const response = await request(app)
                .post('/api/ai-engines/grooc')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    produtos: [{ nome: 'Arroz', quantidade: 1 }],
                    mercadoId: 'merc-1',
                    unidadeId: 'unid-1'
                });

            expect(response.status).toBe(200);
        });
    });

    describe('Rate Limiting', () => {
        it('deve aplicar rate limiting após muitas requisições', async () => {
            // Fazer múltiplas requisições rapidamente
            const requests = Array.from({ length: 15 }, () =>
                request(app)
                    .post('/api/ai-engines/demand')
                    .set('Authorization', `Bearer ${token}`)
                    .send({
                        mercadoId: 'merc-1',
                        produtos: ['prod-1']
                    })
            );

            const responses = await Promise.all(requests);
            
            // Pelo menos uma deve retornar 429 (Too Many Requests)
            const rateLimited = responses.some(r => r.status === 429);
            expect(rateLimited).toBe(true);
        });
    });
});

