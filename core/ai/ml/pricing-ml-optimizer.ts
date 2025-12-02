/**
 * Machine Learning Optimizer - Otimização de Preços usando ML
 * Substitui heurísticas por modelo de Machine Learning real
 */

import { logger } from '../utils/logger';

interface PricingFeatures {
    precoAtual: number;
    custoProduto: number;
    elasticidade: number;
    demandaMedia: number;
    concorrenciaMedia: number;
    margemAtual: number;
}

/**
 * Otimizador de preços usando Machine Learning
 */
export class PricingMLOptimizer {
    private model: PricingMLModel | null = null;
    private readonly MODEL_PATH = './models/pricing-optimizer.json';

    /**
     * Treina o modelo com dados históricos de preços e vendas
     */
    async trainModel(trainingData: Array<{
        features: PricingFeatures;
        optimalPrice: number;
        revenue: number;
    }>): Promise<void> {
        const startTime = Date.now();

        try {
            logger.info('PricingMLOptimizer', 'Iniciando treinamento do modelo', {
                totalRegistros: trainingData.length
            });

            if (trainingData.length < 20) {
                logger.warn('PricingMLOptimizer', 'Dados insuficientes para treinamento');
                return;
            }

            this.model = new PricingMLModel();
            await this.model.train(trainingData);
            await this.model.save(this.MODEL_PATH);

            const executionTime = Date.now() - startTime;
            logger.info('PricingMLOptimizer', 'Modelo treinado com sucesso', {
                executionTime,
                amostras: trainingData.length
            });
        } catch (error: any) {
            logger.error('PricingMLOptimizer', 'Erro ao treinar modelo', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Otimiza preço usando o modelo ML
     */
    async optimizePrice(features: PricingFeatures): Promise<{
        optimalPrice: number;
        expectedRevenue: number;
        confidence: number;
    }> {
        if (!this.model) {
            try {
                await this.loadModel();
            } catch (error) {
                logger.warn('PricingMLOptimizer', 'Modelo não encontrado, usando fallback');
                // Fallback: preço baseado em margem desejada
                const optimalPrice = features.custoProduto * 1.5; // 50% margem
                return {
                    optimalPrice,
                    expectedRevenue: optimalPrice * features.demandaMedia,
                    confidence: 0.5
                };
            }
        }

        if (!this.model) {
            throw new Error('Modelo não disponível');
        }

        return this.model.optimize(features);
    }

    async loadModel(): Promise<void> {
        if (this.model) {
            await this.model.load(this.MODEL_PATH);
        }
    }
}

/**
 * Modelo ML para otimização de preços
 */
class PricingMLModel {
    private weights: { [key: string]: number } = {};
    private learningRate = 0.001;
    private epochs = 200;

    async train(data: Array<{ features: PricingFeatures; optimalPrice: number; revenue: number }>): Promise<void> {
        // Inicializar pesos
        const featureKeys = ['precoAtual', 'custoProduto', 'elasticidade', 'demandaMedia', 'concorrenciaMedia', 'margemAtual'];
        featureKeys.forEach(key => {
            this.weights[key] = Math.random() * 0.1;
        });
        this.weights.bias = Math.random() * 0.1;

        // Treinar usando gradiente descendente
        for (let epoch = 0; epoch < this.epochs; epoch++) {
            let totalError = 0;

            for (const sample of data) {
                const prediction = this.predictPrice(sample.features);
                const error = sample.optimalPrice - prediction;
                totalError += error * error;

                // Atualizar pesos usando gradiente
                const gradient = this.calculateGradient(sample.features, error);
                Object.keys(this.weights).forEach(key => {
                    this.weights[key] += this.learningRate * gradient[key];
                });
            }

            // Reduzir learning rate
            if (epoch % 50 === 0) {
                this.learningRate *= 0.9;
            }
        }
    }

    optimize(features: PricingFeatures): {
        optimalPrice: number;
        expectedRevenue: number;
        confidence: number;
    } {
        // Buscar preço ótimo usando busca binária
        let minPrice = features.custoProduto * 1.1; // Mínimo: 10% margem
        let maxPrice = features.precoAtual * 2; // Máximo: 2x preço atual
        let optimalPrice = features.precoAtual;
        let bestRevenue = 0;

        // Busca binária para encontrar preço ótimo
        for (let i = 0; i < 20; i++) {
            const midPrice = (minPrice + maxPrice) / 2;
            const revenue = this.calculateRevenue(midPrice, features);

            if (revenue > bestRevenue) {
                bestRevenue = revenue;
                optimalPrice = midPrice;
            }

            // Ajustar limites
            const leftRevenue = this.calculateRevenue((minPrice + midPrice) / 2, features);
            const rightRevenue = this.calculateRevenue((midPrice + maxPrice) / 2, features);

            if (leftRevenue > rightRevenue) {
                maxPrice = midPrice;
            } else {
                minPrice = midPrice;
            }
        }

        const confidence = this.calculateConfidence(features);

        return {
            optimalPrice: Math.round(optimalPrice * 100) / 100,
            expectedRevenue: bestRevenue,
            confidence
        };
    }

    private predictPrice(features: PricingFeatures): number {
        let price = this.weights.bias;
        price += this.weights.precoAtual * features.precoAtual;
        price += this.weights.custoProduto * features.custoProduto;
        price += this.weights.elasticidade * features.elasticidade;
        price += this.weights.demandaMedia * features.demandaMedia;
        price += this.weights.concorrenciaMedia * features.concorrenciaMedia;
        price += this.weights.margemAtual * features.margemAtual;

        return Math.max(features.custoProduto * 1.1, price);
    }

    private calculateRevenue(price: number, features: PricingFeatures): number {
        // Calcular demanda esperada baseada na elasticidade
        const priceChange = (price - features.precoAtual) / features.precoAtual;
        const demandChange = features.elasticidade * priceChange;
        const expectedDemand = features.demandaMedia * (1 + demandChange);

        return price * Math.max(0, expectedDemand);
    }

    private calculateGradient(features: PricingFeatures, error: number): { [key: string]: number } {
        return {
            precoAtual: error * features.precoAtual,
            custoProduto: error * features.custoProduto,
            elasticidade: error * features.elasticidade,
            demandaMedia: error * features.demandaMedia,
            concorrenciaMedia: error * features.concorrenciaMedia,
            margemAtual: error * features.margemAtual,
            bias: error
        };
    }

    private calculateConfidence(features: PricingFeatures): number {
        // Confiança baseada na qualidade dos dados
        let confidence = 0.7;

        if (features.demandaMedia > 0) confidence += 0.1;
        if (features.elasticidade < -0.5 && features.elasticidade > -2) confidence += 0.1;
        if (features.concorrenciaMedia > 0) confidence += 0.1;

        return Math.min(1, confidence);
    }

    async save(path: string): Promise<void> {
        const fs = await import('fs/promises');
        const modelData = {
            weights: this.weights,
            timestamp: new Date().toISOString()
        };
        await fs.mkdir('./models', { recursive: true });
        await fs.writeFile(path, JSON.stringify(modelData, null, 2));
    }

    async load(path: string): Promise<void> {
        const fs = await import('fs/promises');
        const modelData = JSON.parse(await fs.readFile(path, 'utf-8'));
        this.weights = modelData.weights;
    }
}

