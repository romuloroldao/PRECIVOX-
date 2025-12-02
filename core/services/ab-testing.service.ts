/**
 * A/B Testing Service - Testes A/B para recomendações
 */

import { logger } from '../ai/utils/logger';
import { prisma } from '../ai/lib/prisma-compat';

export interface ABTest {
    id: string;
    name: string;
    description: string;
    type: 'PRICING' | 'RECOMMENDATION' | 'LAYOUT' | 'FEATURE';
    variants: ABTestVariant[];
    trafficSplit: number; // % de tráfego para teste (0-100)
    startDate: Date;
    endDate?: Date;
    status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
    metrics: ABTestMetrics;
}

export interface ABTestVariant {
    id: string;
    name: string;
    config: any; // Configuração específica do variant
    weight: number; // Peso na distribuição (0-100)
}

export interface ABTestMetrics {
    totalUsers: number;
    variantMetrics: {
        [variantId: string]: {
            users: number;
            conversions: number;
            revenue: number;
            avgOrderValue: number;
            conversionRate: number;
        };
    };
    winner?: string; // ID do variant vencedor
    confidence: number; // Nível de confiança estatística (0-1)
}

export interface ABTestResult {
    userId: string;
    testId: string;
    variantId: string;
    timestamp: Date;
    action?: string; // 'view', 'click', 'convert', etc.
    value?: number; // Valor da conversão (ex: valor da compra)
}

export class ABTestingService {
    /**
     * Cria novo teste A/B
     */
    async createTest(test: Omit<ABTest, 'id' | 'metrics'>): Promise<ABTest> {
        try {
            const dbTest = await prisma.ab_tests.create({
                data: {
                    id: `ab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: test.name,
                    description: test.description,
                    type: test.type,
                    trafficSplit: test.trafficSplit,
                    startDate: test.startDate,
                    endDate: test.endDate || null,
                    status: test.status,
                    variants: test.variants as any,
                    metrics: {
                        totalUsers: 0,
                        variantMetrics: {},
                        confidence: 0
                    } as any,
                    createdBy: test.metadata?.generatedBy || null
                }
            });

            const abTest: ABTest = {
                id: dbTest.id,
                name: dbTest.name,
                description: dbTest.description || undefined,
                type: dbTest.type as any,
                variants: dbTest.variants as any,
                trafficSplit: dbTest.trafficSplit,
                startDate: dbTest.startDate,
                endDate: dbTest.endDate || undefined,
                status: dbTest.status as any,
                metrics: dbTest.metrics as any
            };

            logger.info('ABTestingService', 'Teste A/B criado', {
                testId: abTest.id,
                name: test.name,
                type: test.type
            });

            return abTest;
        } catch (error: any) {
            logger.error('ABTestingService', 'Erro ao criar teste', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Atribui usuário a um variant do teste
     */
    async assignVariant(userId: string, testId: string): Promise<string | null> {
        const test = await this.getTest(testId);
        
        if (!test || test.status !== 'RUNNING') {
            return null;
        }

        // Verificar se usuário já está atribuído
        const existing = await this.getUserVariant(userId, testId);
        if (existing) {
            return existing;
        }

        // Verificar se está dentro do traffic split
        const random = Math.random() * 100;
        if (random > test.trafficSplit) {
            return null; // Usuário não participa do teste
        }

        // Atribuir variant baseado em peso
        const variant = this.selectVariant(test.variants);
        
        try {
            // Salvar atribuição no banco
            await prisma.ab_test_assignments.upsert({
                where: {
                    testId_userId: {
                        testId,
                        userId
                    }
                },
                create: {
                    testId,
                    userId,
                    variantId: variant.id
                },
                update: {
                    variantId: variant.id,
                    assignedAt: new Date()
                }
            });

            // Registrar atribuição como resultado
            await this.recordResult({
                userId,
                testId,
                variantId: variant.id,
                timestamp: new Date(),
                action: 'assigned'
            });

            logger.debug('ABTestingService', 'Variant atribuído', {
                userId,
                testId,
                variantId: variant.id
            });

            return variant.id;
        } catch (error: any) {
            logger.error('ABTestingService', 'Erro ao atribuir variant', {
                userId,
                testId,
                error: error.message
            });
            return null;
        }
    }

    /**
     * Registra resultado de teste
     */
    async recordResult(result: ABTestResult): Promise<void> {
        try {
            // Salvar resultado no banco
            await prisma.ab_test_results.create({
                data: {
                    id: `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    testId: result.testId,
                    userId: result.userId,
                    variantId: result.variantId,
                    action: result.action || null,
                    value: result.value ? result.value : null,
                    metadata: result.data || null,
                    timestamp: result.timestamp
                }
            });

            // Atualizar métricas do teste
            const test = await this.getTest(result.testId);
            if (!test) return;

            // Recalcular métricas a partir dos resultados no banco
            await this.recalculateMetrics(result.testId);

            logger.debug('ABTestingService', 'Resultado registrado', {
                testId: result.testId,
                variantId: result.variantId,
                action: result.action
            });
        } catch (error: any) {
            logger.error('ABTestingService', 'Erro ao registrar resultado', {
                error: error.message
            });
        }
    }

    /**
     * Recalcula métricas do teste a partir dos resultados no banco
     */
    private async recalculateMetrics(testId: string): Promise<void> {
        try {
            const test = await this.getTest(testId);
            if (!test) return;

            // Buscar todos os resultados
            const results = await prisma.ab_test_results.findMany({
                where: { testId }
            });

            // Buscar todas as atribuições
            const assignments = await prisma.ab_test_assignments.findMany({
                where: { testId }
            });

            // Inicializar métricas
            const metrics: ABTestMetrics = {
                totalUsers: assignments.length,
                variantMetrics: {},
                confidence: 0
            };

            // Contar usuários por variant
            assignments.forEach(assignment => {
                if (!metrics.variantMetrics[assignment.variantId]) {
                    metrics.variantMetrics[assignment.variantId] = {
                        users: 0,
                        conversions: 0,
                        revenue: 0,
                        avgOrderValue: 0,
                        conversionRate: 0
                    };
                }
                metrics.variantMetrics[assignment.variantId].users++;
            });

            // Processar conversões
            results.forEach(result => {
                if (result.action === 'convert' && result.variantId) {
                    const variantMetrics = metrics.variantMetrics[result.variantId];
                    if (variantMetrics) {
                        variantMetrics.conversions++;
                        if (result.value) {
                            variantMetrics.revenue += Number(result.value);
                            variantMetrics.avgOrderValue = variantMetrics.revenue / variantMetrics.conversions;
                        }
                        if (variantMetrics.users > 0) {
                            variantMetrics.conversionRate = variantMetrics.conversions / variantMetrics.users;
                        }
                    }
                }
            });

            // Calcular confiança estatística
            metrics.confidence = this.calculateConfidence(metrics);

            // Determinar vencedor se houver confiança suficiente
            if (metrics.confidence > 0.95) {
                metrics.winner = this.determineWinner(metrics);
            }

            // Atualizar no banco
            await prisma.ab_tests.update({
                where: { id: testId },
                data: {
                    metrics: metrics as any,
                    updatedAt: new Date()
                }
            });
        } catch (error: any) {
            logger.error('ABTestingService', 'Erro ao recalcular métricas', {
                testId,
                error: error.message
            });
        }
    }

    /**
     * Obtém variant atribuído a um usuário
     */
    async getUserVariant(userId: string, testId: string): Promise<string | null> {
        try {
            const assignment = await prisma.ab_test_assignments.findUnique({
                where: {
                    testId_userId: {
                        testId,
                        userId
                    }
                }
            });

            return assignment?.variantId || null;
        } catch (error: any) {
            logger.error('ABTestingService', 'Erro ao buscar variant', {
                userId,
                testId,
                error: error.message
            });
            return null;
        }
    }

    /**
     * Obtém teste por ID
     */
    async getTest(testId: string): Promise<ABTest | null> {
        try {
            const dbTest = await prisma.ab_tests.findUnique({
                where: { id: testId }
            });

            if (!dbTest) return null;

            return {
                id: dbTest.id,
                name: dbTest.name,
                description: dbTest.description || undefined,
                type: dbTest.type as any,
                variants: dbTest.variants as any,
                trafficSplit: dbTest.trafficSplit,
                startDate: dbTest.startDate,
                endDate: dbTest.endDate || undefined,
                status: dbTest.status as any,
                metrics: dbTest.metrics as any
            };
        } catch (error: any) {
            logger.error('ABTestingService', 'Erro ao buscar teste', {
                testId,
                error: error.message
            });
            return null;
        }
    }

    /**
     * Seleciona variant baseado em peso
     */
    private selectVariant(variants: ABTestVariant[]): ABTestVariant {
        const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
        let random = Math.random() * totalWeight;

        for (const variant of variants) {
            random -= variant.weight;
            if (random <= 0) {
                return variant;
            }
        }

        return variants[0]; // Fallback
    }

    /**
     * Calcula nível de confiança estatística
     */
    private calculateConfidence(metrics: ABTestMetrics): number {
        const variants = Object.keys(metrics.variantMetrics);
        if (variants.length < 2) return 0;

        // Teste de significância estatística (teste t simples)
        const variant1 = metrics.variantMetrics[variants[0]];
        const variant2 = metrics.variantMetrics[variants[1]];

        if (variant1.users < 30 || variant2.users < 30) {
            return 0; // Amostra muito pequena
        }

        const p1 = variant1.conversionRate;
        const p2 = variant2.conversionRate;
        const n1 = variant1.users;
        const n2 = variant2.users;

        // Calcular z-score
        const p = (variant1.conversions + variant2.conversions) / (n1 + n2);
        const se = Math.sqrt(p * (1 - p) * (1/n1 + 1/n2));
        const z = Math.abs((p1 - p2) / se);

        // Converter z-score para nível de confiança (aproximado)
        // z > 1.96 = 95% confiança, z > 2.58 = 99% confiança
        if (z > 2.58) return 0.99;
        if (z > 1.96) return 0.95;
        if (z > 1.65) return 0.90;
        return Math.min(0.90, z / 2.58);
    }

    /**
     * Determina variant vencedor
     */
    private determineWinner(metrics: ABTestMetrics): string {
        let winner = '';
        let bestRate = 0;

        Object.entries(metrics.variantMetrics).forEach(([variantId, variantMetrics]) => {
            if (variantMetrics.conversionRate > bestRate) {
                bestRate = variantMetrics.conversionRate;
                winner = variantId;
            }
        });

        return winner;
    }

    /**
     * Finaliza teste e determina vencedor
     */
    async completeTest(testId: string): Promise<ABTest> {
        const test = await this.getTest(testId);
        if (!test) {
            throw new Error('Teste não encontrado');
        }

        // Recalcular métricas antes de finalizar
        await this.recalculateMetrics(testId);

        // Atualizar teste no banco
        const updated = await prisma.ab_tests.update({
            where: { id: testId },
            data: {
                status: 'COMPLETED',
                endDate: new Date(),
                updatedAt: new Date()
            }
        });

        const completedTest: ABTest = {
            ...test,
            status: 'COMPLETED',
            endDate: updated.endDate || undefined
        };

        if (completedTest.metrics.confidence > 0.95) {
            logger.info('ABTestingService', 'Teste A/B finalizado com vencedor', {
                testId,
                winner: completedTest.metrics.winner,
                confidence: completedTest.metrics.confidence
            });
        } else {
            logger.warn('ABTestingService', 'Teste A/B finalizado sem confiança suficiente', {
                testId,
                confidence: completedTest.metrics.confidence
            });
        }

        return completedTest;
    }
}

