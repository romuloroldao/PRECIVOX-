/**
 * Promotion Engine
 * 
 * Sugere promoções automáticas baseadas em:
 * - Giro de produtos
 * - Estoque
 * - Comportamento do consumidor
 * - Sazonalidade
 * 
 * Features:
 * - Sugestão de itens para promoção
 * - A/B test automático
 * - Avaliação de impacto em margem e giro
 */

import { prisma } from '@/lib/prisma';
import { EventCollector } from './event-collector';
import { MarketBehaviorEngine } from './behavior-engine';
import { PromotionSuggestion, AIAnalysisResult } from './types';

export class PromotionEngine {
  /**
   * Gera sugestões de promoção para um mercado
   */
  static async generatePromotionSuggestions(
    mercadoId: string,
    limite: number = 10
  ): Promise<AIAnalysisResult<PromotionSuggestion[]>> {
    // Buscar produtos ativos
    // Nota: Produtos não têm relação direta com mercado no schema atual
    // Filtrar por mercado será implementado quando schema tiver relação
    const produtos = await prisma.produtos.findMany({
      where: {
        ativo: true,
      },
      take: 100, // Analisar top 100 produtos
    });

    const sugestoes: PromotionSuggestion[] = [];

    for (const produto of produtos) {
      const sugestao = await this.analyzeProductForPromotion(produto.id, mercadoId);
      if (sugestao) {
        sugestoes.push(sugestao);
      }
    }

    // Ordenar por impacto esperado
    sugestoes.sort((a, b) => {
      const impactoA = a.impactoEsperado.aumentoVendas;
      const impactoB = b.impactoEsperado.aumentoVendas;
      return impactoB - impactoA;
    });

    const topSugestoes = sugestoes.slice(0, limite);

    // Gerar explicação geral
    const explicacao = this.generatePromotionExplanation(topSugestoes);

    return {
      data: topSugestoes,
      explicacao,
      confianca: this.calculatePromotionConfidence(topSugestoes),
      fatores: this.extractPromotionFactors(topSugestoes),
      timestamp: new Date(),
    };
  }

  /**
   * Analisa um produto específico para promoção
   */
  private static async analyzeProductForPromotion(
    produtoId: string,
    mercadoId: string
  ): Promise<PromotionSuggestion | null> {
    // Analisar ciclo de vida do produto
    const lifecycle = await MarketBehaviorEngine.analyzeProductLifecycle(
      produtoId,
      mercadoId,
      3 // últimos 3 meses
    );

    // Buscar informações do produto com estoque
    const produto = await prisma.produtos.findUnique({
      where: { id: produtoId },
      include: {
        estoques: true,
      },
    });

    if (!produto) return null;

    // Verificar estoque (pegar o mais recente)
    const estoquesOrdenados = produto.estoques
      ?.sort((a, b) => b.atualizadoEm.getTime() - a.atualizadoEm.getTime()) || [];
    const estoqueAtual = estoquesOrdenados[0]?.quantidade || 0;
    const estoqueMinimo = produto.pontoReposicao || 0;

    // Calcular giro atual
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 30);

    const eventos = await EventCollector.getMarketEvents(
      mercadoId,
      inicio,
      fim,
      'compra_realizada'
    );

    const comprasProduto = eventos.filter(e => e.metadata.produtoId === produtoId);
    const giroAtual = comprasProduto.reduce((sum, e) => sum + (e.metadata.quantidade || 0), 0) / 30;

    // Decidir se deve sugerir promoção
    const devePromover = this.shouldPromote(
      lifecycle.data,
      estoqueAtual,
      estoqueMinimo,
      giroAtual
    );

    if (!devePromover) return null;

    // Calcular desconto sugerido
    const desconto = this.calculateSuggestedDiscount(
      lifecycle.data,
      estoqueAtual,
      estoqueMinimo,
      giroAtual
    );

    // Pegar preço do estoque mais recente (já ordenado acima)
    const precoAtual = estoquesOrdenados[0]?.preco ? Number(estoquesOrdenados[0].preco) : 0;

    // Calcular impacto esperado
    const impacto = this.calculateExpectedImpact(desconto, giroAtual, precoAtual);

    // Gerar motivo
    const motivo = this.generatePromotionReason(
      lifecycle.data,
      estoqueAtual,
      estoqueMinimo,
      giroAtual
    );

    // Sugerir A/B test se apropriado
    const abTest = this.suggestABTest(desconto, impacto);

    return {
      id: `promo-${produtoId}-${Date.now()}`,
      produtoId,
      mercadoId,
      tipo: 'desconto_percentual',
      valor: desconto,
      duracao: this.calculatePromotionDuration(estoqueAtual, estoqueMinimo),
      motivo,
      impactoEsperado: impacto,
      confianca: lifecycle.confianca,
      fatores: lifecycle.fatores,
      abTestSugerido: abTest,
    };
  }

  private static shouldPromote(
    lifecycle: any,
    estoqueAtual: number,
    estoqueMinimo: number,
    giroAtual: number
  ): boolean {
    // Promover se:
    // 1. Estoque alto e giro baixo (liquidação)
    if (estoqueAtual > estoqueMinimo * 2 && giroAtual < 0.5) {
      return true;
    }

    // 2. Produto em declínio
    if (lifecycle.fase === 'declinio') {
      return true;
    }

    // 3. Produto em introdução com baixo giro
    if (lifecycle.fase === 'introducao' && giroAtual < 1) {
      return true;
    }

    // 4. Estoque próximo do mínimo
    if (estoqueAtual <= estoqueMinimo * 1.2) {
      return true; // Promover para evitar ruptura
    }

    return false;
  }

  private static calculateSuggestedDiscount(
    lifecycle: any,
    estoqueAtual: number,
    estoqueMinimo: number,
    giroAtual: number
  ): number {
    let desconto = 0;

    // Estoque alto e giro baixo = desconto maior
    if (estoqueAtual > estoqueMinimo * 2 && giroAtual < 0.5) {
      desconto = 30; // 30% de desconto
    }
    // Produto em declínio = desconto médio
    else if (lifecycle.fase === 'declinio') {
      desconto = 20; // 20% de desconto
    }
    // Produto em introdução = desconto baixo
    else if (lifecycle.fase === 'introducao') {
      desconto = 10; // 10% de desconto
    }
    // Estoque baixo = desconto pequeno para evitar ruptura
    else if (estoqueAtual <= estoqueMinimo * 1.2) {
      desconto = 5; // 5% de desconto
    }

    return desconto;
  }

  private static calculateExpectedImpact(
    desconto: number,
    giroAtual: number,
    preco: number
  ): PromotionSuggestion['impactoEsperado'] {
    // Estimativa: desconto de X% aumenta vendas em Y%
    // Fórmula simplificada: aumento = desconto * 1.5 (elasticidade)
    const aumentoVendas = desconto * 1.5;

    // Impacto na margem: negativo proporcional ao desconto
    const impactoMargem = -desconto;

    // Impacto no giro: aumento proporcional
    const impactoGiro = (giroAtual * aumentoVendas) / 100;

    return {
      aumentoVendas: Math.round(aumentoVendas * 10) / 10,
      impactoMargem: Math.round(impactoMargem * 10) / 10,
      impactoGiro: Math.round(impactoGiro * 10) / 10,
    };
  }

  private static generatePromotionReason(
    lifecycle: any,
    estoqueAtual: number,
    estoqueMinimo: number,
    giroAtual: number
  ): string {
    const razoes: string[] = [];

    if (estoqueAtual > estoqueMinimo * 2 && giroAtual < 0.5) {
      razoes.push(`Estoque alto (${estoqueAtual} unidades) com giro baixo (${giroAtual.toFixed(1)}/dia)`);
    }

    if (lifecycle.fase === 'declinio') {
      razoes.push(`Produto em fase de declínio`);
    }

    if (lifecycle.fase === 'introducao' && giroAtual < 1) {
      razoes.push(`Produto em introdução com baixo giro`);
    }

    if (estoqueAtual <= estoqueMinimo * 1.2) {
      razoes.push(`Estoque próximo do mínimo (${estoqueAtual}/${estoqueMinimo})`);
    }

    return razoes.join('. ') || 'Análise de comportamento e estoque indica oportunidade de promoção.';
  }

  private static suggestABTest(
    desconto: number,
    impacto: PromotionSuggestion['impactoEsperado']
  ): PromotionSuggestion['abTestSugerido'] | undefined {
    // Sugerir A/B test se desconto for médio (10-20%)
    if (desconto >= 10 && desconto <= 20) {
      return {
        grupoA: desconto,
        grupoB: desconto + 5, // Testar com 5% a mais
        duracao: 7, // 7 dias
      };
    }

    return undefined;
  }

  private static calculatePromotionDuration(
    estoqueAtual: number,
    estoqueMinimo: number
  ): number {
    // Duração baseada no estoque
    if (estoqueAtual > estoqueMinimo * 3) {
      return 14; // 2 semanas para estoque alto
    } else if (estoqueAtual > estoqueMinimo * 2) {
      return 7; // 1 semana para estoque médio
    } else {
      return 3; // 3 dias para estoque baixo
    }
  }

  private static generatePromotionExplanation(
    sugestoes: PromotionSuggestion[]
  ): string {
    if (sugestoes.length === 0) {
      return 'Nenhuma sugestão de promoção no momento. Todos os produtos estão com giro adequado.';
    }

    const top3 = sugestoes.slice(0, 3);
    const motivos = top3.map(s => s.motivo).join('; ');

    return `Foram identificadas ${sugestoes.length} oportunidades de promoção. ` +
      `Top 3: ${motivos}. ` +
      `Todas as sugestões são baseadas em análise de giro, estoque e ciclo de vida dos produtos.`;
  }

  private static calculatePromotionConfidence(
    sugestoes: PromotionSuggestion[]
  ): number {
    if (sugestoes.length === 0) return 0;

    const confiancaMedia = sugestoes.reduce((sum, s) => sum + s.confianca, 0) / sugestoes.length;
    return Math.round(confiancaMedia);
  }

  private static extractPromotionFactors(
    sugestoes: PromotionSuggestion[]
  ): string[] {
    const fatores = new Set<string>();

    sugestoes.forEach(s => {
      s.fatores.forEach(f => fatores.add(f));
    });

    return Array.from(fatores);
  }
}

