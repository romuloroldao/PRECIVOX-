/**
 * PRECIVOX AI Core - Main Entry Point
 * 
 * Este módulo exporta todos os engines de IA disponíveis:
 * - DemandPredictor: Previsão de demanda
 * - StockHealthEngine: Análise de saúde do estoque
 * - SmartPricingEngine: Precificação inteligente
 * - GROOCRecommendationEngine: Recomendações de produtos e rotas
 */

// Engines
import { DemandPredictor } from './engines/demand-predictor';
import { StockHealthEngine } from './engines/stock-health';
import { SmartPricingEngine } from './engines/smart-pricing';
import { GROOCRecommendationEngine } from './engines/grooc-recommendation';

export { DemandPredictor, StockHealthEngine, SmartPricingEngine, GROOCRecommendationEngine };

// Services
export { StockDataService } from './services/stock-data.service';
export { SalesDataService } from './services/sales-data.service';

// Utils
export { logger } from './utils/logger';
export { metricsCollector } from './utils/metrics';

// Types
export * from './types/common';
export * from './engines/demand-predictor/types';
export * from './engines/stock-health/types';
export * from './engines/smart-pricing/types';
export * from './engines/grooc-recommendation/types';

/**
 * Factory para criar instâncias dos engines
 */
export class AIEngineFactory {
    static createDemandPredictor() {
        return new DemandPredictor();
    }

    static createStockHealthEngine() {
        return new StockHealthEngine();
    }

    static createSmartPricingEngine() {
        return new SmartPricingEngine();
    }

    static createGROOCEngine() {
        return new GROOCRecommendationEngine();
    }

    /**
     * Cria todas as engines de uma vez
     */
    static createAll() {
        return {
            demandPredictor: this.createDemandPredictor(),
            stockHealth: this.createStockHealthEngine(),
            smartPricing: this.createSmartPricingEngine(),
            grooc: this.createGROOCEngine()
        };
    }
}
