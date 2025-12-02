/**
 * Machine Learning Predictor - Previsão de Demanda usando ML
 * Substitui heurísticas por modelo de Machine Learning real
 */

import { SalesRecord } from '../types/common';
import { logger } from '../utils/logger';

interface MLModel {
    predict(features: number[][]): number[];
    train(data: { features: number[][]; labels: number[] }): Promise<void>;
    save(path: string): Promise<void>;
    load(path: string): Promise<void>;
}

/**
 * Implementação de modelo ML simples usando regressão linear
 * Em produção, pode ser substituído por TensorFlow.js ou modelo treinado externamente
 */
export class DemandMLPredictor {
    private model: MLModel | null = null;
    private readonly MODEL_PATH = './models/demand-predictor.json';
    private isTraining = false;

    /**
     * Treina o modelo com dados históricos
     */
    async trainModel(historicalData: SalesRecord[]): Promise<void> {
        if (this.isTraining) {
            logger.warn('DemandMLPredictor', 'Modelo já está sendo treinado');
            return;
        }

        this.isTraining = true;
        const startTime = Date.now();

        try {
            logger.info('DemandMLPredictor', 'Iniciando treinamento do modelo', {
                totalRegistros: historicalData.length
            });

            // Preparar features e labels
            const features: number[][] = [];
            const labels: number[] = [];

            // Features: dia da semana, mês, quantidade média dos últimos 7 dias, tendência
            for (let i = 7; i < historicalData.length; i++) {
                const record = historicalData[i];
                const prev7Days = historicalData.slice(Math.max(0, i - 7), i);
                
                const feature = [
                    record.data.getDay() / 6, // Normalizado 0-1
                    record.data.getMonth() / 11, // Normalizado 0-1
                    prev7Days.reduce((sum, r) => sum + r.quantidade, 0) / prev7Days.length / 100, // Normalizado
                    this.calculateTrend(prev7Days) // -1 a 1
                ];

                features.push(feature);
                labels.push(record.quantidade);
            }

            if (features.length < 10) {
                logger.warn('DemandMLPredictor', 'Dados insuficientes para treinamento', {
                    registros: features.length
                });
                this.isTraining = false;
                return;
            }

            // Criar e treinar modelo (regressão linear simples)
            this.model = new SimpleLinearRegression();
            await this.model.train({ features, labels });

            // Salvar modelo
            await this.model.save(this.MODEL_PATH);

            const executionTime = Date.now() - startTime;
            logger.info('DemandMLPredictor', 'Modelo treinado com sucesso', {
                executionTime,
                amostras: features.length
            });
        } catch (error: any) {
            logger.error('DemandMLPredictor', 'Erro ao treinar modelo', {
                error: error.message
            });
            throw error;
        } finally {
            this.isTraining = false;
        }
    }

    /**
     * Faz previsão usando o modelo ML
     */
    async predict(features: number[][]): Promise<number[]> {
        if (!this.model) {
            // Se modelo não existe, tentar carregar
            try {
                await this.loadModel();
            } catch (error) {
                logger.warn('DemandMLPredictor', 'Modelo não encontrado, usando fallback');
                // Fallback para média simples
                return features.map(() => 10); // Valor padrão
            }
        }

        if (!this.model) {
            throw new Error('Modelo não disponível');
        }

        return this.model.predict(features);
    }

    /**
     * Carrega modelo salvo
     */
    async loadModel(): Promise<void> {
        if (this.model) {
            await this.model.load(this.MODEL_PATH);
        }
    }

    /**
     * Calcula tendência dos últimos registros
     */
    private calculateTrend(records: SalesRecord[]): number {
        if (records.length < 2) return 0;

        const midPoint = Math.floor(records.length / 2);
        const firstHalf = records.slice(0, midPoint);
        const secondHalf = records.slice(midPoint);

        const avgFirst = firstHalf.reduce((sum, r) => sum + r.quantidade, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((sum, r) => sum + r.quantidade, 0) / secondHalf.length;

        if (avgFirst === 0) return 0;
        return (avgSecond - avgFirst) / avgFirst; // Normalizado -1 a 1
    }
}

/**
 * Implementação simples de regressão linear
 * Em produção, usar TensorFlow.js ou modelo externo
 */
class SimpleLinearRegression implements MLModel {
    private weights: number[] = [];
    private bias: number = 0;
    private learningRate = 0.01;
    private epochs = 100;

    async train(data: { features: number[][]; labels: number[] }): Promise<void> {
        const { features, labels } = data;
        const featureCount = features[0].length;

        // Inicializar pesos aleatórios
        this.weights = Array(featureCount).fill(0).map(() => Math.random() * 0.1);
        this.bias = Math.random() * 0.1;

        // Treinar usando gradiente descendente
        for (let epoch = 0; epoch < this.epochs; epoch++) {
            let totalError = 0;

            for (let i = 0; i < features.length; i++) {
                const prediction = this.predictSingle(features[i]);
                const error = labels[i] - prediction;
                totalError += error * error;

                // Atualizar pesos
                for (let j = 0; j < featureCount; j++) {
                    this.weights[j] += this.learningRate * error * features[i][j];
                }
                this.bias += this.learningRate * error;
            }

            // Reduzir learning rate ao longo do tempo
            if (epoch % 20 === 0) {
                this.learningRate *= 0.9;
            }
        }
    }

    predict(features: number[][]): number[] {
        return features.map(f => this.predictSingle(f));
    }

    private predictSingle(features: number[]): number {
        let prediction = this.bias;
        for (let i = 0; i < features.length; i++) {
            prediction += this.weights[i] * features[i];
        }
        return Math.max(0, prediction); // Não permitir valores negativos
    }

    async save(path: string): Promise<void> {
        const fs = await import('fs/promises');
        const modelData = {
            weights: this.weights,
            bias: this.bias,
            timestamp: new Date().toISOString()
        };
        await fs.mkdir('./models', { recursive: true });
        await fs.writeFile(path, JSON.stringify(modelData, null, 2));
    }

    async load(path: string): Promise<void> {
        const fs = await import('fs/promises');
        const modelData = JSON.parse(await fs.readFile(path, 'utf-8'));
        this.weights = modelData.weights;
        this.bias = modelData.bias;
    }
}

