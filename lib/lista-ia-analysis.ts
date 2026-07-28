/**
 * Cliente para análise de lista via AI Gateway (BFF Next.js).
 */

import type { ItemLista } from '@/app/context/ListaContext';

export interface ListaAnaliseSugestao {
  id?: string;
  type?: string;
  title?: string;
  description?: string;
  impact?: {
    savings?: number;
    timeReduction?: number;
    qualityImpact?: string;
  };
  confidence?: number;
  actionable?: boolean;
}

export interface ListaAnaliseResultado {
  estimatedSavings: number;
  efficiencyScore: number;
  totalCost: number;
  insights: string[];
  warnings: string[];
  explicacao?: string | null;
  suggestions: ListaAnaliseSugestao[];
  processingTimeMs?: number;
  offline?: boolean;
}

function precoItem(item: ItemLista): number {
  return item.emPromocao && item.precoPromocional ? item.precoPromocional : item.preco;
}

/** Converte itens da lista ativa para o formato esperado pelo gateway. */
export function mapItensParaAnalise(itens: ItemLista[]) {
  return itens.map((item) => ({
    produto: {
      nome: item.nome,
      preco: precoItem(item),
      loja: item.unidade.mercado.nome,
      categoria: item.categoria || 'Geral',
    },
    quantidade: item.quantidade,
  }));
}

function normalizarInsights(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.map((x) => String(x)).filter(Boolean);
  }
  if (typeof val === 'string' && val.trim()) return [val];
  return [];
}

function extrairAnalise(payload: Record<string, unknown>): ListaAnaliseResultado | null {
  const analysis = (payload.analysis ?? payload) as Record<string, unknown>;
  if (!analysis || typeof analysis !== 'object') return null;

  return {
    totalCost: Number(analysis.totalCost) || 0,
    estimatedSavings: Number(analysis.estimatedSavings) || 0,
    efficiencyScore: Number(analysis.efficiencyScore) || 0,
    insights: normalizarInsights(analysis.insights),
    warnings: normalizarInsights(analysis.warnings),
    explicacao: typeof analysis.explicacao === 'string' ? analysis.explicacao : null,
    suggestions: Array.isArray(payload.suggestions) ? (payload.suggestions as ListaAnaliseSugestao[]) : [],
    processingTimeMs: Number((payload.metadata as Record<string, unknown>)?.processingTime) || undefined,
    offline: (payload.metadata as Record<string, unknown>)?.model === 'mock',
  };
}

/**
 * Solicita análise da lista ao AI Gateway.
 * Requer sessão autenticada (CLIENTE+).
 */
export async function fetchAnaliseLista(
  itens: ItemLista[],
  sessionId?: string | null
): Promise<ListaAnaliseResultado | null> {
  if (itens.length === 0) return null;

  const res = await fetch('/api/ai/gateway/shopping-list-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      sessionId: sessionId ?? `lista-${Date.now()}`,
      listItems: mapItensParaAnalise(itens),
    }),
  });

  if (res.status === 401) return null;

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error || 'Falha na análise da lista');
  }

  const data = (json.data ?? json) as Record<string, unknown>;
  return extrairAnalise(data);
}
