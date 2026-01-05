'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  MetricCard, 
  AlertBadge, 
  ScoreGauge, 
  TrendIndicator,
  DemandHeatmap,
  StockRuptureIndicator,
  ExcessStockIndicator,
  PriceElasticityCurve
} from '@/components/ai-dashboard';
import { ActionableInsight } from '@/components/gestor/ActionableInsight';
import { Button, Card } from '@/components/shared';
import { TOKENS } from '@/styles/tokens';
import { TrendingUp, Package, AlertTriangle, DollarSign, RefreshCw, Lightbulb } from 'lucide-react';
import { fetchDashboardData } from '@/lib/ai-api';

export default function AIInsightsDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [actionableInsights, setActionableInsights] = useState<any[]>([]);

  // Obter mercadoId do usuário logado
  const mercadoId = (session?.user as any)?.mercadoId || 'mercado-1764614505466-1'; // Fallback para teste

  useEffect(() => {
    if (session) {
      loadDashboardData();
    }
  }, [session]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchDashboardData(mercadoId);
      
      // Processar dados para o formato do dashboard
      const processedData = {
        metrics: {
          totalProducts: data.demand.predictions.length || 0,
          stockHealth: data.stockHealth?.score || 0,
          avgDemand: calculateAvgDemand(data.demand.predictions),
          priceOptimization: calculatePriceOptimization(data.pricing.recommendations),
        },
        trends: {
          sales: calculateSalesTrend(data.demand.predictions),
          stock: data.stockHealth?.score ? (data.stockHealth.score - 75) : 0,
          demand: calculateDemandTrend(data.demand.predictions),
        },
        alerts: data.stockHealth?.alertas || [],
        demandHeatmap: data.demand.heatmap || [],
        stockRupture: data.stockHealth?.produtosRisco || [],
        excessStock: data.stockHealth?.produtosExcesso || [],
        priceElasticity: data.pricing.elasticity || [],
        recommendations: data.pricing.recommendations || [],
      };

      setDashboardData(processedData);
      
      // Gerar insights acionáveis
      const insights = generateActionableInsights(processedData, data);
      setActionableInsights(insights);
      
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Erro ao carregar dashboard:', err);
      setError(err.message || 'Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Gerar insights acionáveis a partir dos dados
  const generateActionableInsights = (processedData: any, rawData: any) => {
    const insights: any[] = [];

    // 1. Insights de Ruptura de Estoque (URGENTE)
    if (processedData.stockRupture && processedData.stockRupture.length > 0) {
      const produtosRisco = processedData.stockRupture.slice(0, 12);
      const impactoTotal = produtosRisco.reduce((sum: number, produto: any) => {
        // Estimar impacto: R$ 50 por produto em risco (perda de venda)
        return sum + (produto.risco * 5000); // 5000 centavos = R$ 50
      }, 0);

      insights.push({
        type: 'URGENTE' as const,
        title: `${produtosRisco.length} produtos vão acabar em breve`,
        description: `Estes produtos estão com estoque baixo e podem acabar nas próximas horas. Faça o pedido agora para evitar perda de vendas.`,
        impactValue: impactoTotal,
        impactType: 'negative' as const,
        priority: 10,
        products: produtosRisco.map((p: any) => ({
          id: p.id,
          name: p.nome,
          quantity: Math.ceil(p.diasEstoque),
        })),
        actions: [
          {
            label: 'Fazer Pedido Agora',
            type: 'pedido' as const,
            onClick: () => {
              // TODO: Abrir modal de pedido com produtos pré-selecionados
              console.log('Abrir modal de pedido', produtosRisco);
              alert(`Abrir modal de pedido para ${produtosRisco.length} produtos`);
            },
          },
          {
            label: 'Ver Detalhes',
            type: 'ver-detalhes' as const,
            onClick: () => {
              // TODO: Navegar para página de detalhes
              console.log('Ver detalhes de ruptura');
            },
          },
        ],
      });
    }

    // 2. Insights de Oportunidade de Promoção (OPORTUNIDADE)
    if (processedData.recommendations && processedData.recommendations.length > 0) {
      const oportunidades = processedData.recommendations
        .filter((rec: any) => rec.impactoEstimado?.receita > 0)
        .slice(0, 5);

      if (oportunidades.length > 0) {
        const impactoTotal = oportunidades.reduce((sum: number, rec: any) => {
          return sum + (rec.impactoEstimado?.receita || 0) * 100; // Converter para centavos
        }, 0);

        insights.push({
          type: 'OPORTUNIDADE' as const,
          title: `Reduza preços e venda ${oportunidades.length > 1 ? 'mais' : 'mais'}`,
          description: `Ajustando o preço destes produtos, você pode aumentar as vendas significativamente. A IA sugere reduções estratégicas que geram mais receita.`,
          impactValue: impactoTotal,
          impactType: 'positive' as const,
          priority: 8,
          products: oportunidades.map((rec: any) => ({
            id: rec.produtoId,
            name: rec.produtoNome,
          })),
          actions: [
            {
              label: 'Criar Promoção',
              type: 'promocao' as const,
              onClick: () => {
                // TODO: Abrir modal de promoção
                console.log('Abrir modal de promoção', oportunidades);
                alert(`Abrir modal de promoção para ${oportunidades.length} produtos`);
              },
            },
            {
              label: 'Ver Análise',
              type: 'ver-detalhes' as const,
              onClick: () => {
                console.log('Ver análise de preços');
              },
            },
          ],
        });
      }
    }

    // 3. Insights de Estoque Excedente (MELHORIA)
    if (processedData.excessStock && processedData.excessStock.length > 0) {
      const produtosExcesso = processedData.excessStock.slice(0, 8);
      // Estimar custo de capital parado: R$ 10 por produto em excesso
      const impactoTotal = produtosExcesso.length * 1000; // 1000 centavos = R$ 10

      insights.push({
        type: 'MELHORIA' as const,
        title: `${produtosExcesso.length} produtos com estoque alto`,
        description: `Estes produtos estão com muito estoque parado, ocupando espaço e capital. Considere criar promoções para acelerar a venda.`,
        impactValue: impactoTotal,
        impactType: 'negative' as const,
        priority: 6,
        products: produtosExcesso.map((p: any) => ({
          id: p.id,
          name: p.nome,
        })),
        actions: [
          {
            label: 'Criar Promoção',
            type: 'promocao' as const,
            onClick: () => {
              console.log('Criar promoção para produtos em excesso', produtosExcesso);
              alert(`Abrir modal de promoção para ${produtosExcesso.length} produtos`);
            },
          },
          {
            label: 'Ajustar Estoque',
            type: 'ajuste' as const,
            onClick: () => {
              console.log('Ajustar estoque');
            },
          },
        ],
      });
    }

    // 4. Insight de Saúde do Estoque (MELHORIA)
    if (processedData.metrics.stockHealth < 70) {
      const diferenca = 70 - processedData.metrics.stockHealth;
      const impactoEstimado = diferenca * 10000; // R$ 100 por ponto abaixo de 70

      insights.push({
        type: 'MELHORIA' as const,
        title: `Saúde do estoque: ${Math.round(processedData.metrics.stockHealth)}%`,
        description: `Seu estoque está ${diferenca > 10 ? 'bem' : 'um pouco'} abaixo do ideal. Faça estas ações para melhorar para ÓTIMO (80%+).`,
        impactValue: impactoEstimado,
        impactType: 'positive' as const,
        priority: 7,
        actions: [
          {
            label: 'Ver Ações Recomendadas',
            type: 'ver-detalhes' as const,
            onClick: () => {
              console.log('Ver ações recomendadas');
            },
          },
        ],
      });
    }

    // Ordenar por prioridade (maior primeiro)
    return insights.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando insights de IA...</p>
          <p className="text-gray-400 text-sm mt-2">Analisando dados do mercado</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao Carregar Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            variant="primary"
            onClick={loadDashboardData}
          >
            <RefreshCw className="h-5 w-5" style={{ marginRight: TOKENS.spacing[2] }} />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Inteligência</h1>
            <p className="text-gray-600">Insights e análises preditivas para otimização do negócio</p>
            {lastUpdate && (
              <p className="text-sm text-gray-400 mt-1">
                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={loadDashboardData}
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} style={{ marginRight: TOKENS.spacing[2] }} />
            Atualizar
          </Button>
        </div>

        {/* NOVA SEÇÃO: Insights Acionáveis */}
        {actionableInsights.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-6 w-6" color={TOKENS.colors.accent[600]} />
              <h2 className="text-2xl font-bold text-gray-900">Insights Acionáveis</h2>
              <span
                style={{
                  padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[2]}`,
                  borderRadius: TOKENS.borderRadius.full,
                  backgroundColor: TOKENS.colors.accent[100],
                  color: TOKENS.colors.accent[700],
                  fontSize: TOKENS.typography.fontSize.sm,
                  fontWeight: TOKENS.typography.fontWeight.semibold,
                }}
              >
                {actionableInsights.length}
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {actionableInsights.map((insight, index) => (
                <ActionableInsight key={index} {...insight} />
              ))}
            </div>
          </div>
        )}

        {/* Alerts Section */}
        {dashboardData.alerts && dashboardData.alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Alertas Importantes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.alerts.slice(0, 6).map((alert: any, index: number) => (
                <AlertBadge
                  key={index}
                  type={alert.tipo}
                  message={alert.mensagem}
                />
              ))}
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total de Produtos"
            value={dashboardData.metrics.totalProducts}
            icon={Package}
            color="blue"
            trend={{
              value: dashboardData.trends.sales,
              label: 'vs mês anterior',
              direction: dashboardData.trends.sales > 0 ? 'up' : 'down'
            }}
          />
          
          <MetricCard
            title="Saúde do Estoque"
            value={`${Math.round(dashboardData.metrics.stockHealth)}%`}
            icon={TrendingUp}
            color="green"
            trend={{
              value: dashboardData.trends.stock,
              label: 'vs semana anterior',
              direction: dashboardData.trends.stock > 0 ? 'up' : 'down'
            }}
          />
          
          <MetricCard
            title="Demanda Média"
            value={Math.round(dashboardData.metrics.avgDemand)}
            icon={TrendingUp}
            color="purple"
            trend={{
              value: dashboardData.trends.demand,
              label: 'vs semana anterior',
              direction: dashboardData.trends.demand > 0 ? 'up' : 'down'
            }}
          />
          
          <MetricCard
            title="Otimização de Preço"
            value={`${Math.round(dashboardData.metrics.priceOptimization)}%`}
            icon={DollarSign}
            color="orange"
            trend={{
              value: 5.3,
              label: 'potencial de melhoria',
              direction: 'up'
            }}
          />
        </div>

        {/* Score Gauge */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Score Geral de Saúde</h2>
            <ScoreGauge 
              score={Math.round(dashboardData.metrics.stockHealth)} 
              label="Saúde do Estoque"
            />
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Demand Heatmap */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mapa de Calor - Demanda</h2>
            <DemandHeatmap data={dashboardData.demandHeatmap} />
          </div>

          {/* Price Elasticity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Curva de Elasticidade de Preço</h2>
            <PriceElasticityCurve data={dashboardData.priceElasticity} />
          </div>
        </div>

        {/* Stock Indicators */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Rupture */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Risco de Ruptura</h2>
            <StockRuptureIndicator data={dashboardData.stockRupture} />
          </div>

          {/* Excess Stock */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Estoque Excedente</h2>
            <ExcessStockIndicator data={dashboardData.excessStock} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions para cálculos

function calculateAvgDemand(predictions: any[]): number {
  if (!predictions || predictions.length === 0) return 0;
  const total = predictions.reduce((acc, pred) => acc + (pred.demandaPrevista || 0), 0);
  return total / predictions.length;
}

function calculatePriceOptimization(recommendations: any[]): number {
  if (!recommendations || recommendations.length === 0) return 0;
  // Calcular % de produtos com preço otimizado
  const optimized = recommendations.filter(rec => 
    Math.abs(rec.precoSugerido - rec.precoAtual) < rec.precoAtual * 0.05
  ).length;
  return (optimized / recommendations.length) * 100;
}

function calculateSalesTrend(predictions: any[]): number {
  if (!predictions || predictions.length === 0) return 0;
  // Simular tendência baseada nas previsões
  const avgTendencia = predictions.reduce((acc, pred) => {
    const trendValue = pred.tendencia === 'alta' ? 1 : pred.tendencia === 'baixa' ? -1 : 0;
    return acc + trendValue;
  }, 0) / predictions.length;
  return avgTendencia * 10; // Escalar para %
}

function calculateDemandTrend(predictions: any[]): number {
  if (!predictions || predictions.length === 0) return 0;
  // Calcular tendência média de demanda
  const highDemand = predictions.filter(p => p.tendencia === 'alta').length;
  return ((highDemand / predictions.length) - 0.5) * 20; // Converter para %
}
