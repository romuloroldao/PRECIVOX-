/**
 * Serviço de API para Engines de IA
 * Centraliza todas as chamadas aos endpoints /api/ai-engines/*
 */

import { apiFetch } from './api-client';

export interface DemandPrediction {
  produtoId: string;
  produtoNome: string;
  demandaPrevista: number;
  confianca: number;
  tendencia: 'alta' | 'baixa' | 'estavel';
}

export interface StockAlert {
  tipo: 'ruptura' | 'excesso' | 'vencimento';
  produtoId: string;
  produtoNome: string;
  severidade: 'alta' | 'media' | 'baixa';
  diasEstoque: number;
  mensagem: string;
}

export interface StockHealthData {
  score: number;
  alertas: StockAlert[];
  produtosRisco: Array<{
    id: string;
    nome: string;
    diasEstoque: number;
    risco: number;
  }>;
  produtosExcesso: Array<{
    id: string;
    nome: string;
    diasEstoque: number;
  }>;
}

export interface PricingRecommendation {
  produtoId: string;
  produtoNome: string;
  precoAtual: number;
  precoSugerido: number;
  elasticidade: number;
  impactoEstimado: {
    vendas: number;
    receita: number;
  };
}

export interface DemandHeatmapData {
  dia: string;
  hora: number;
  intensidade: number;
}

/**
 * Busca previsões de demanda
 */
export async function fetchDemandPredictions(mercadoId: string) {
  const { data, error } = await apiFetch<{ data: { predictions: DemandPrediction[] } }>(
    '/api/ai-engines/demand',
    {
      method: 'POST',
      body: JSON.stringify({ mercadoId }),
    }
  );

  if (error) {
    console.error('Erro ao buscar previsões de demanda:', error);
    return { predictions: [], heatmap: [] };
  }

  return {
    predictions: data?.data?.predictions || [],
    heatmap: generateHeatmapFromPredictions(data?.data?.predictions || []),
  };
}

/**
 * Busca análise de saúde do estoque
 */
export async function fetchStockHealth(mercadoId: string) {
  const { data, error } = await apiFetch<{ data: StockHealthData }>(
    '/api/ai-engines/stock-health',
    {
      method: 'POST',
      body: JSON.stringify({ mercadoId }),
    }
  );

  if (error) {
    console.error('Erro ao buscar saúde do estoque:', error);
    return null;
  }

  return data?.data || null;
}

/**
 * Busca recomendações de precificação
 */
export async function fetchPricingRecommendations(mercadoId: string) {
  const { data, error} = await apiFetch<{ data: { recommendations: PricingRecommendation[] } }>(
    '/api/ai-engines/pricing',
    {
      method: 'POST',
      body: JSON.stringify({ mercadoId }),
    }
  );

  if (error) {
    console.error('Erro ao buscar recomendações de preço:', error);
    return { recommendations: [], elasticity: [] };
  }

  return {
    recommendations: data?.data?.recommendations || [],
    elasticity: generateElasticityData(data?.data?.recommendations || []),
  };
}

/**
 * Busca recomendações GROOC
 */
export async function fetchGROOCRecommendations(mercadoId: string, usuarioId?: string) {
  const { data, error } = await apiFetch<{ data: any }>(
    '/api/ai-engines/grooc',
    {
      method: 'POST',
      body: JSON.stringify({ mercadoId, usuarioId }),
    }
  );

  if (error) {
    console.error('Erro ao buscar recomendações GROOC:', error);
    return null;
  }

  return data?.data || null;
}

/**
 * Busca estatísticas do cache
 */
export async function fetchCacheStats() {
  const { data, error } = await apiFetch<any>('/api/ai-engines/cache/stats');

  if (error) {
    console.error('Erro ao buscar stats do cache:', error);
    return null;
  }

  return data;
}

/**
 * Limpa o cache
 */
export async function clearCache() {
  const { data, error } = await apiFetch<any>('/api/ai-engines/cache', {
    method: 'DELETE',
  });

  if (error) {
    console.error('Erro ao limpar cache:', error);
    return false;
  }

  return true;
}

/**
 * Carrega todos os dados do dashboard de uma vez
 */
export async function fetchDashboardData(mercadoId: string) {
  try {
    const [demand, stockHealth, pricing] = await Promise.all([
      fetchDemandPredictions(mercadoId),
      fetchStockHealth(mercadoId),
      fetchPricingRecommendations(mercadoId),
    ]);

    return {
      demand,
      stockHealth,
      pricing,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error);
    throw error;
  }
}

// Helper functions

function generateHeatmapFromPredictions(predictions: DemandPrediction[]): DemandHeatmapData[] {
  const heatmap: DemandHeatmapData[] = [];
  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  
  // Gerar dados de heatmap baseados nas previsões
  dias.forEach((dia, diaIndex) => {
    for (let hora = 0; hora < 24; hora++) {
      // Calcular intensidade baseada nas previsões
      const intensidade = predictions.reduce((acc, pred) => {
        return acc + (pred.demandaPrevista / predictions.length);
      }, 0);
      
      heatmap.push({
        dia,
        hora,
        intensidade: Math.round(intensidade * (0.5 + Math.random() * 0.5)), // Variação por hora
      });
    }
  });
  
  return heatmap;
}

function generateElasticityData(recommendations: PricingRecommendation[]) {
  return recommendations.map(rec => ({
    preco: rec.precoAtual,
    demanda: 100, // Base
    precoSugerido: rec.precoSugerido,
    demandaEstimada: 100 + rec.impactoEstimado.vendas,
    elasticidade: rec.elasticidade,
  }));
}
