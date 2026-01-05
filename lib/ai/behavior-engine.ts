/**
 * Market Behavior Engine
 * 
 * Analisa comportamento do consumidor baseado em eventos
 * 
 * Outputs:
 * - Horários de pico
 * - Perfil de usuário
 * - Ciclo de vida do produto
 * - Intenção de compra
 */

import { prisma } from '@/lib/prisma';
import { EventCollector } from './event-collector';
import {
  UserBehaviorProfile,
  ProductLifecycle,
  AIAnalysisResult,
} from './types';

export class MarketBehaviorEngine {
  /**
   * Analisa perfil de comportamento de um usuário
   */
  static async analyzeUserBehavior(
    userId: string,
    mercadoId: string,
    diasAnalise: number = 30
  ): Promise<AIAnalysisResult<UserBehaviorProfile>> {
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - diasAnalise);

    const eventos = await EventCollector.getUserEvents(userId, mercadoId, inicio, fim);

    // Analisar horários de pico
    const horariosPico = this.analyzePeakHours(eventos);
    
    // Analisar categorias preferidas
    const categoriasPreferidas = this.analyzePreferredCategories(eventos);
    
    // Analisar produtos frequentes
    const produtosFrequentes = this.analyzeFrequentProducts(eventos);
    
    // Analisar padrão de compras
    const padraoCompras = this.analyzePurchasePattern(eventos);
    
    // Analisar intenção de compra
    const intencaoCompra = this.analyzePurchaseIntent(eventos);

    const profile: UserBehaviorProfile = {
      userId,
      mercadoId,
      horariosPico,
      categoriasPreferidas,
      produtosFrequentes,
      padraoCompras,
      intencaoCompra,
    };

    // Gerar explicação
    const explicacao = this.generateBehaviorExplanation(profile, eventos.length);

    return {
      data: profile,
      explicacao,
      confianca: this.calculateConfidence(eventos.length, diasAnalise),
      fatores: this.extractFactors(profile),
      timestamp: new Date(),
    };
  }

  /**
   * Analisa ciclo de vida de um produto
   */
  static async analyzeProductLifecycle(
    produtoId: string,
    mercadoId: string,
    mesesAnalise: number = 6
  ): Promise<AIAnalysisResult<ProductLifecycle>> {
    const fim = new Date();
    const inicio = new Date();
    inicio.setMonth(inicio.getMonth() - mesesAnalise);

    // Buscar eventos relacionados ao produto
    const eventos = await EventCollector.getMarketEvents(
      mercadoId,
      inicio,
      fim,
      'produto_adicionado_lista'
    );

    const eventosProduto = eventos.filter(e => e.metadata.produtoId === produtoId);

    // Calcular giro
    const giro = await this.calculateProductTurnover(produtoId, mercadoId, inicio, fim);

    // Analisar tendência
    const tendencia = this.analyzeTrend(eventosProduto, mesesAnalise);

    // Analisar sazonalidade
    const sazonalidade = this.analyzeSeasonality(eventosProduto, mesesAnalise);

    // Determinar fase do ciclo de vida
    const fase = this.determineLifecyclePhase(giro, tendencia, sazonalidade);

    const lifecycle: ProductLifecycle = {
      produtoId,
      mercadoId,
      fase,
      giro,
      tendencia,
      sazonalidade,
      explicacao: this.generateLifecycleExplanation(fase, giro, tendencia),
    };

    return {
      data: lifecycle,
      explicacao: lifecycle.explicacao,
      confianca: this.calculateConfidence(eventosProduto.length, mesesAnalise * 30),
      fatores: [
        `Giro: ${giro.toFixed(1)} unidades/dia`,
        `Tendência: ${tendencia}`,
        `Fase: ${fase}`,
      ],
      timestamp: new Date(),
    };
  }

  // Métodos auxiliares privados

  private static analyzePeakHours(eventos: any[]): UserBehaviorProfile['horariosPico'] {
    const hourCounts = new Map<string, number>();

    eventos.forEach(event => {
      const date = new Date(event.timestamp);
      const key = `${date.getDay()}-${date.getHours()}`;
      hourCounts.set(key, (hourCounts.get(key) || 0) + 1);
    });

    return Array.from(hourCounts.entries())
      .map(([key, frequencia]) => {
        const [diaSemana, hora] = key.split('-').map(Number);
        return { diaSemana, hora, frequencia };
      })
      .sort((a, b) => b.frequencia - a.frequencia)
      .slice(0, 10); // Top 10 horários
  }

  private static analyzePreferredCategories(eventos: any[]): UserBehaviorProfile['categoriasPreferidas'] {
    const categoryCounts = new Map<string, { count: number; lastInteraction: Date }>();

    eventos.forEach(event => {
      if (event.metadata.categoriaId) {
        const catId = event.metadata.categoriaId;
        const existing = categoryCounts.get(catId);
        const eventDate = new Date(event.timestamp);

        if (!existing || eventDate > existing.lastInteraction) {
          categoryCounts.set(catId, {
            count: (existing?.count || 0) + 1,
            lastInteraction: eventDate,
          });
        }
      }
    });

    return Array.from(categoryCounts.entries())
      .map(([categoriaId, data]) => ({
        categoriaId,
        frequencia: data.count,
        ultimaInteracao: data.lastInteraction,
      }))
      .sort((a, b) => b.frequencia - a.frequencia);
  }

  private static analyzeFrequentProducts(eventos: any[]): UserBehaviorProfile['produtosFrequentes'] {
    const productCounts = new Map<string, { count: number; lastPurchase: Date }>();

    eventos.forEach(event => {
      if (event.metadata.produtoId && event.type === 'compra_realizada') {
        const prodId = event.metadata.produtoId;
        const existing = productCounts.get(prodId);
        const eventDate = new Date(event.timestamp);

        if (!existing || eventDate > existing.lastPurchase) {
          productCounts.set(prodId, {
            count: (existing?.count || 0) + 1,
            lastPurchase: eventDate,
          });
        }
      }
    });

    return Array.from(productCounts.entries())
      .map(([produtoId, data]) => ({
        produtoId,
        frequencia: data.count,
        ultimaCompra: data.lastPurchase,
      }))
      .sort((a, b) => b.frequencia - a.frequencia);
  }

  private static analyzePurchasePattern(eventos: any[]): UserBehaviorProfile['padraoCompras'] {
    const compras = eventos.filter(e => e.type === 'compra_realizada');
    
    if (compras.length < 2) {
      return {
        diasEntreCompras: 0,
        valorMedio: 0,
        itensMedios: 0,
      };
    }

    const diasEntreCompras = compras
      .map((c, i) => {
        if (i === 0) return 0;
        const diff = new Date(c.timestamp).getTime() - new Date(compras[i - 1].timestamp).getTime();
        return diff / (1000 * 60 * 60 * 24); // dias
      })
      .filter(d => d > 0)
      .reduce((sum, d) => sum + d, 0) / (compras.length - 1);

    const valorMedio = compras.reduce((sum, c) => sum + (c.metadata.preco || 0), 0) / compras.length;
    const itensMedios = compras.reduce((sum, c) => sum + (c.metadata.quantidade || 0), 0) / compras.length;

    return {
      diasEntreCompras: Math.round(diasEntreCompras * 10) / 10,
      valorMedio: Math.round(valorMedio * 100) / 100,
      itensMedios: Math.round(itensMedios * 10) / 10,
    };
  }

  private static analyzePurchaseIntent(eventos: any[]): UserBehaviorProfile['intencaoCompra'] {
    // Fatores que indicam intenção de compra
    const fatores: string[] = [];
    let score = 50; // Base

    // Lista criada recentemente
    const listasRecentes = eventos.filter(
      e => e.type === 'lista_criada' && 
      new Date(e.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    if (listasRecentes.length > 0) {
      score += 20;
      fatores.push('Lista de compras criada recentemente');
    }

    // Produtos adicionados à lista
    const produtosAdicionados = eventos.filter(e => e.type === 'produto_adicionado_lista');
    if (produtosAdicionados.length > 5) {
      score += 15;
      fatores.push('Múltiplos produtos adicionados à lista');
    }

    // Buscas frequentes
    const buscas = eventos.filter(e => e.type === 'produto_buscado');
    if (buscas.length > 3) {
      score += 10;
      fatores.push('Múltiplas buscas realizadas');
    }

    // Visualizações de produtos
    const visualizacoes = eventos.filter(e => e.type === 'produto_visualizado');
    if (visualizacoes.length > 10) {
      score += 5;
      fatores.push('Alto engajamento com produtos');
    }

    score = Math.min(100, Math.max(0, score));

    return {
      score,
      fatores,
      confianca: Math.min(100, eventos.length * 5), // Mais eventos = mais confiança
    };
  }

  private static async calculateProductTurnover(
    produtoId: string,
    mercadoId: string,
    inicio: Date,
    fim: Date
  ): Promise<number> {
    try {
      const eventos = await EventCollector.getMarketEvents(
        mercadoId,
        inicio,
        fim,
        'compra_realizada'
      );

      const comprasProduto = eventos.filter(
        e => e.metadata.produtoId === produtoId
      );

      const totalQuantidade = comprasProduto.reduce(
        (sum, e) => sum + (e.metadata.quantidade || 0),
        0
      );

      const dias = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
      return totalQuantidade / dias;
    } catch (error) {
      console.error('[BehaviorEngine] Erro ao calcular giro:', error);
      return 0;
    }
  }

  private static analyzeTrend(eventos: any[], meses: number): 'crescendo' | 'estavel' | 'declinando' {
    if (eventos.length < 2) return 'estavel';

    const metade = Math.floor(eventos.length / 2);
    const primeiraMetade = eventos.slice(0, metade);
    const segundaMetade = eventos.slice(metade);

    const mediaPrimeira = primeiraMetade.length / (meses / 2);
    const mediaSegunda = segundaMetade.length / (meses / 2);

    const variacao = ((mediaSegunda - mediaPrimeira) / mediaPrimeira) * 100;

    if (variacao > 10) return 'crescendo';
    if (variacao < -10) return 'declinando';
    return 'estavel';
  }

  private static analyzeSeasonality(eventos: any[], meses: number): ProductLifecycle['sazonalidade'] {
    const mesCounts = new Map<number, number>();

    eventos.forEach(event => {
      const mes = new Date(event.timestamp).getMonth();
      mesCounts.set(mes, (mesCounts.get(mes) || 0) + 1);
    });

    const media = eventos.length / 12;

    return Array.from(mesCounts.entries())
      .map(([mes, count]) => ({
        mes,
        multiplicador: count / media,
      }))
      .sort((a, b) => a.mes - b.mes);
  }

  private static determineLifecyclePhase(
    giro: number,
    tendencia: string,
    sazonalidade: ProductLifecycle['sazonalidade']
  ): ProductLifecycle['fase'] {
    if (giro < 0.1) return 'declinio';
    if (tendencia === 'crescendo' && giro < 1) return 'introducao';
    if (tendencia === 'crescendo' && giro >= 1) return 'crescimento';
    if (tendencia === 'estavel' && giro >= 0.5) return 'maturidade';
    return 'declinio';
  }

  private static generateBehaviorExplanation(
    profile: UserBehaviorProfile,
    totalEventos: number
  ): string {
    const horarios = profile.horariosPico.slice(0, 3);
    const topCategoria = profile.categoriasPreferidas[0];
    const intencao = profile.intencaoCompra;

    return `Perfil baseado em ${totalEventos} eventos analisados. ` +
      `Usuário mais ativo nos horários: ${horarios.map(h => `${h.hora}h`).join(', ')}. ` +
      (topCategoria ? `Categoria preferida: ${topCategoria.categoriaId} (${topCategoria.frequencia} interações). ` : '') +
      `Intenção de compra: ${intencao.score}/100 (${intencao.fatores.join(', ')}).`;
  }

  private static generateLifecycleExplanation(
    fase: string,
    giro: number,
    tendencia: string
  ): string {
    return `Produto em fase de ${fase} com giro de ${giro.toFixed(1)} unidades/dia. ` +
      `Tendência: ${tendencia}. ` +
      `Esta fase foi determinada baseada no volume de vendas e padrão de crescimento.`;
  }

  private static calculateConfidence(eventos: number, dias: number): number {
    // Mais eventos e mais dias = mais confiança
    const eventosPorDia = eventos / dias;
    const confianca = Math.min(100, eventosPorDia * 2);
    return Math.round(confianca);
  }

  private static extractFactors(profile: UserBehaviorProfile): string[] {
    const fatores: string[] = [];

    if (profile.horariosPico.length > 0) {
      fatores.push(`${profile.horariosPico.length} horários de pico identificados`);
    }

    if (profile.categoriasPreferidas.length > 0) {
      fatores.push(`${profile.categoriasPreferidas.length} categorias preferidas`);
    }

    if (profile.produtosFrequentes.length > 0) {
      fatores.push(`${profile.produtosFrequentes.length} produtos frequentes`);
    }

    if (profile.intencaoCompra.score > 70) {
      fatores.push('Alta intenção de compra');
    }

    return fatores;
  }
}

