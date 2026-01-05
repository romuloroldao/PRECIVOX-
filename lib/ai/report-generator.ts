/**
 * Weekly Market Report Generator
 * 
 * Gera relatório semanal de saúde do mercado
 * com resumo textual explicável
 */

import { MarketHealthEngine } from './health-engine';
import { PromotionEngine } from './promotion-engine';
import { WeeklyMarketReport, AIAnalysisResult } from './types';

export class ReportGenerator {
  /**
   * Gera relatório semanal de saúde do mercado
   */
  static async generateWeeklyReport(
    mercadoId: string
  ): Promise<AIAnalysisResult<WeeklyMarketReport>> {
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 7); // Última semana

    // Calcular health score atual
    const healthScoreAtual = await MarketHealthEngine.calculateHealthScore(mercadoId, 7);

    // Calcular health score da semana anterior para comparar
    const inicioAnterior = new Date(inicio);
    inicioAnterior.setDate(inicioAnterior.getDate() - 7);
    const healthScoreAnterior = await MarketHealthEngine.calculateHealthScore(mercadoId, 7);

    // Gerar sugestões de promoção
    const promocoes = await PromotionEngine.generatePromotionSuggestions(mercadoId, 5);

    // Determinar tendência
    const variacao = healthScoreAtual.data.score - healthScoreAnterior.data.score;
    const tendencia: WeeklyMarketReport['resumo']['tendencia'] =
      variacao > 5 ? 'melhorando' :
      variacao < -5 ? 'piorando' :
      'estavel';

    // Gerar top insights
    const topInsights = this.generateTopInsights(
      healthScoreAtual.data,
      promocoes.data,
      variacao
    );

    // Gerar explicação textual
    const explicacao = this.generateTextualExplanation(
      healthScoreAtual.data,
      variacao,
      tendencia,
      topInsights,
      promocoes.data
    );

    const report: WeeklyMarketReport = {
      mercadoId,
      periodo: {
        inicio,
        fim,
      },
      resumo: {
        score: healthScoreAtual.data.score,
        tendencia,
        variacao: Math.round(variacao * 10) / 10,
      },
      metricas: healthScoreAtual.data.metricas,
      topInsights,
      sugestoesPromocao: promocoes.data,
      sugestoesLayout: [], // Será implementado com Gondola AI
      explicacao,
    };

    return {
      data: report,
      explicacao,
      confianca: healthScoreAtual.confianca,
      fatores: healthScoreAtual.fatores,
      timestamp: new Date(),
    };
  }

  private static generateTopInsights(
    healthScore: any,
    promocoes: any[],
    variacao: number
  ): WeeklyMarketReport['topInsights'] {
    const insights: WeeklyMarketReport['topInsights'] = [];

    // Insight de health score
    if (Math.abs(variacao) > 5) {
      insights.push({
        tipo: 'promocao',
        titulo: `Health Score ${variacao > 0 ? 'melhorou' : 'piorou'}`,
        descricao: `Score ${variacao > 0 ? 'aumentou' : 'diminuiu'} ${Math.abs(variacao).toFixed(1)} pontos em relação à semana anterior`,
        impacto: Math.abs(variacao),
        acaoSugerida: variacao > 0
          ? 'Manter estratégias atuais'
          : 'Revisar recomendações do Health Score',
      });
    }

    // Insight de ruptura de estoque
    if (healthScore.metricas.rupturaEstoque.impacto < -5) {
      insights.push({
        tipo: 'estoque',
        titulo: 'Alta ruptura de estoque',
        descricao: `${healthScore.metricas.rupturaEstoque.valor.toFixed(1)}% dos produtos estão com estoque baixo`,
        impacto: Math.abs(healthScore.metricas.rupturaEstoque.impacto),
        acaoSugerida: 'Reabastecer produtos prioritários',
      });
    }

    // Insight de conversão
    if (healthScore.metricas.conversaoListaCompra.impacto < -5) {
      insights.push({
        tipo: 'produto',
        titulo: 'Conversão lista→compra baixa',
        descricao: `Apenas ${healthScore.metricas.conversaoListaCompra.valor.toFixed(1)}% das listas resultam em compra`,
        impacto: Math.abs(healthScore.metricas.conversaoListaCompra.impacto),
        acaoSugerida: 'Melhorar engajamento com notificações e lembretes',
      });
    }

    // Insight de promoções
    if (promocoes.length > 0) {
      const topPromocao = promocoes[0];
      insights.push({
        tipo: 'promocao',
        titulo: 'Oportunidade de promoção identificada',
        descricao: `${topPromocao.motivo}. Impacto esperado: ${topPromocao.impactoEsperado.aumentoVendas}% aumento em vendas`,
        impacto: topPromocao.impactoEsperado.aumentoVendas,
        acaoSugerida: `Aplicar promoção de ${topPromocao.valor}% no produto ${topPromocao.produtoId}`,
      });
    }

    return insights.slice(0, 5); // Top 5
  }

  private static generateTextualExplanation(
    healthScore: any,
    variacao: number,
    tendencia: string,
    insights: WeeklyMarketReport['topInsights'],
    promocoes: any[]
  ): string {
    let explicacao = `Relatório Semanal de Saúde do Mercado\n\n`;

    // Resumo executivo
    explicacao += `RESUMO EXECUTIVO\n`;
    explicacao += `Health Score: ${healthScore.score}/100 `;
    explicacao += `(${tendencia}, ${variacao > 0 ? '+' : ''}${variacao.toFixed(1)} pontos)\n\n`;

    // Métricas principais
    explicacao += `MÉTRICAS PRINCIPAIS\n`;
    explicacao += `- Ruptura de estoque: ${healthScore.metricas.rupturaEstoque.valor.toFixed(1)}% `;
    explicacao += `(impacto: ${healthScore.metricas.rupturaEstoque.impacto > 0 ? '+' : ''}${healthScore.metricas.rupturaEstoque.impacto.toFixed(1)})\n`;
    explicacao += `- Giro de produtos: ${healthScore.metricas.giroProdutos.valor.toFixed(1)} unidades/dia\n`;
    explicacao += `- Conversão lista→compra: ${healthScore.metricas.conversaoListaCompra.valor.toFixed(1)}%\n`;
    explicacao += `- Engajamento: ${healthScore.metricas.engajamentoUsuarios.valor.toFixed(1)} eventos/usuário/dia\n\n`;

    // Insights principais
    if (insights.length > 0) {
      explicacao += `INSIGHTS PRINCIPAIS\n`;
      insights.forEach((insight, i) => {
        explicacao += `${i + 1}. ${insight.titulo}: ${insight.descricao}\n`;
        explicacao += `   Ação sugerida: ${insight.acaoSugerida}\n\n`;
      });
    }

    // Oportunidades de promoção
    if (promocoes.length > 0) {
      explicacao += `OPORTUNIDADES DE PROMOÇÃO\n`;
      promocoes.slice(0, 3).forEach((promo, i) => {
        explicacao += `${i + 1}. Produto ${promo.produtoId}: ${promo.motivo}\n`;
        explicacao += `   Desconto sugerido: ${promo.valor}% por ${promo.duracao} dias\n`;
        explicacao += `   Impacto esperado: +${promo.impactoEsperado.aumentoVendas}% vendas, `;
        explicacao += `${promo.impactoEsperado.impactoMargem}% margem\n\n`;
      });
    }

    // Recomendações
    if (healthScore.recomendacoes.length > 0) {
      explicacao += `RECOMENDAÇÕES PRIORITÁRIAS\n`;
      healthScore.recomendacoes
        .filter(r => r.prioridade === 'alta')
        .forEach((rec, i) => {
          explicacao += `${i + 1}. ${rec.acao}\n`;
          explicacao += `   Motivo: ${rec.motivo}\n`;
          explicacao += `   Impacto esperado: +${rec.impactoEsperado} pontos no Health Score\n\n`;
        });
    }

    explicacao += `\nEste relatório foi gerado automaticamente baseado em análise de eventos, `;
    explicacao += `comportamento do consumidor e métricas de estoque. Todas as sugestões `;
    explicacao += `são explicáveis e requerem aprovação do administrador antes de serem aplicadas.`;

    return explicacao;
  }
}

