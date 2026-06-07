/**
 * Testes de integração — Route Handlers app/api/ai/*
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/token-manager', () => ({
  TokenManager: {
    validateSession: jest.fn(),
  },
}));

jest.mock('@/core/ai', () => ({
  DemandPredictor: jest.fn().mockImplementation(() => ({
    predict: jest.fn().mockResolvedValue({
      success: true,
      data: { previsoes: [{ quantidadeEsperada: 10, confianca: 0.8 }] },
    }),
  })),
  StockHealthEngine: jest.fn().mockImplementation(() => ({
    analyze: jest.fn().mockResolvedValue({
      success: true,
      data: { score: 85, status: 'SAUDAVEL' },
    }),
  })),
  SmartPricingEngine: jest.fn().mockImplementation(() => ({
    analyze: jest.fn().mockResolvedValue({
      success: true,
      data: { precoOtimo: 9.99 },
    }),
  })),
  GROOCRecommendationEngine: jest.fn().mockImplementation(() => ({
    recommend: jest.fn().mockResolvedValue({
      success: true,
      data: { recomendacoes: [] },
    }),
  })),
}));

import { TokenManager } from '@/lib/token-manager';
import { POST as demandPrediction } from '@/app/api/ai/demand-prediction/route';
import { POST as stockHealth } from '@/app/api/ai/stock-health/route';
import { POST as smartPricing } from '@/app/api/ai/smart-pricing/route';
import { POST as groocRecommendations } from '@/app/api/ai/grooc-recommendations/route';

const mockGestor = { id: 'gestor-1', email: 'gestor@test.com', role: 'GESTOR' as const };

function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('API /api/ai/* — integração', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (TokenManager.validateSession as jest.Mock).mockResolvedValue(mockGestor);
  });

  describe('POST /api/ai/demand-prediction', () => {
    it('retorna 401 sem sessão', async () => {
      (TokenManager.validateSession as jest.Mock).mockResolvedValue(null);
      const res = await demandPrediction(
        jsonRequest('http://localhost/api/ai/demand-prediction', {
          produtoId: 'p1',
          unidadeId: 'u1',
        }),
      );
      expect(res.status).toBe(401);
    });

    it('retorna previsão com gestor autenticado', async () => {
      const res = await demandPrediction(
        jsonRequest('http://localhost/api/ai/demand-prediction', {
          produtoId: 'p1',
          unidadeId: 'u1',
        }),
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  describe('POST /api/ai/stock-health', () => {
    it('retorna análise com gestor autenticado', async () => {
      const res = await stockHealth(
        jsonRequest('http://localhost/api/ai/stock-health', {
          unidadeId: 'u1',
          mercadoId: 'm1',
        }),
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.score).toBe(85);
    });
  });

  describe('POST /api/ai/smart-pricing', () => {
    it('retorna 403 para cliente', async () => {
      (TokenManager.validateSession as jest.Mock).mockResolvedValue({
        id: 'c1',
        email: 'c@test.com',
        role: 'CLIENTE',
      });
      const res = await smartPricing(
        jsonRequest('http://localhost/api/ai/smart-pricing', {
          produtoId: 'p1',
          unidadeId: 'u1',
          precoAtual: 10,
        }),
      );
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/ai/grooc-recommendations', () => {
    it('aceita cliente autenticado', async () => {
      (TokenManager.validateSession as jest.Mock).mockResolvedValue({
        id: 'c1',
        email: 'c@test.com',
        role: 'CLIENTE',
      });
      const res = await groocRecommendations(
        jsonRequest('http://localhost/api/ai/grooc-recommendations', {
          produtos: [{ nome: 'Arroz', quantidade: 1 }],
        }),
      );
      expect(res.status).toBe(200);
    });
  });
});
