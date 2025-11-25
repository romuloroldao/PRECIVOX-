/**
 * Métricas e utilitários para engines de IA
 */

export interface PerformanceMetrics {
    executionTime: number;
    memoryUsed?: number;
    itemsProcessed: number;
    successRate: number;
}

export class MetricsCollector {
    private metrics: Map<string, PerformanceMetrics[]> = new Map();

    /**
     * Registra métrica de execução
     */
    record(engineName: string, metrics: PerformanceMetrics) {
        if (!this.metrics.has(engineName)) {
            this.metrics.set(engineName, []);
        }

        this.metrics.get(engineName)!.push({
            ...metrics,
            memoryUsed: process.memoryUsage().heapUsed
        });

        // Manter apenas últimas 100 execuções
        const engineMetrics = this.metrics.get(engineName)!;
        if (engineMetrics.length > 100) {
            engineMetrics.shift();
        }
    }

    /**
     * Calcula estatísticas agregadas
     */
    getStats(engineName: string) {
        const engineMetrics = this.metrics.get(engineName) || [];

        if (engineMetrics.length === 0) {
            return null;
        }

        const executionTimes = engineMetrics.map(m => m.executionTime);
        const successRates = engineMetrics.map(m => m.successRate);

        return {
            totalExecutions: engineMetrics.length,
            avgExecutionTime: executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length,
            minExecutionTime: Math.min(...executionTimes),
            maxExecutionTime: Math.max(...executionTimes),
            avgSuccessRate: successRates.reduce((a, b) => a + b, 0) / successRates.length,
            totalItemsProcessed: engineMetrics.reduce((sum, m) => sum + m.itemsProcessed, 0)
        };
    }

    /**
     * Limpa métricas de um engine
     */
    clear(engineName?: string) {
        if (engineName) {
            this.metrics.delete(engineName);
        } else {
            this.metrics.clear();
        }
    }
}

// Singleton instance
export const metricsCollector = new MetricsCollector();

/**
 * Decorator para medir tempo de execução
 */
export function measureTime() {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const start = Date.now();
            const result = await originalMethod.apply(this, args);
            const executionTime = Date.now() - start;

            console.log(`[METRICS] ${target.constructor.name}.${propertyKey} executed in ${executionTime}ms`);

            return result;
        };

        return descriptor;
    };
}
