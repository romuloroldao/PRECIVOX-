/**
 * Smart Pricing Engine - Main Entry Point
 */

import { PricingCalculator } from './calculator';
import { PricingAnalysisInput, PricingAnalysisOutput } from './types';
import { logger } from '../../utils/logger';
import { AIEngineResult } from '../../types/common';

export class SmartPricingEngine {
    private calculator: PricingCalculator;
    private readonly ENGINE_NAME = 'SmartPricingEngine';
    private readonly VERSION = '1.0.0';

    constructor() {
        this.calculator = new PricingCalculator();
    }

    async analyze(input: PricingAnalysisInput): Promise<AIEngineResult<PricingAnalysisOutput>> {
        const startTime = Date.now();

        try {
            const result = await this.calculator.calculate(input);
            const executionTime = Date.now() - startTime;

            return {
                success: true,
                data: result,
                metadata: {
                    engineName: this.ENGINE_NAME,
                    executionTime,
                    timestamp: new Date(),
                    version: this.VERSION
                }
            };
        } catch (error: any) {
            logger.error(this.ENGINE_NAME, 'Erro na análise', { error: error.message });

            return {
                success: false,
                error: error.message,
                metadata: {
                    engineName: this.ENGINE_NAME,
                    executionTime: Date.now() - startTime,
                    timestamp: new Date(),
                    version: this.VERSION
                }
            };
        }
    }
}

export * from './types';
