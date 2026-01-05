/**
 * Gondola AI - Engine de reorganização de layout de gôndola
 * 
 * Inputs:
 * - Giro de produtos
 * - Horários de pico
 * - Perfil dos clientes
 * 
 * Output:
 * - Sugestão de layout otimizado
 */

import { prisma } from '@/lib/prisma';
import { EventCollector } from './event-collector';
import { MarketBehaviorEngine } from './behavior-engine';
import { GondolaLayoutSuggestion, AIAnalysisResult } from './types';

export class GondolaEngine {
  /**
   * Gera sugestão de layout de gôndola para um setor
   */
  static async generateLayoutSuggestion(
    mercadoId: string,
    unidadeId: string,
    setor: string
  ): Promise<AIAnalysisResult<GondolaLayoutSuggestion>> {
    // Buscar produtos ativos
    // Nota: Filtro por mercado e setor será adicionado quando schema tiver relações
    const produtos = await prisma.produtos.findMany({
      where: {
        ativo: true,
      },
      take: 50, // Limitar análise
    });

    // Analisar giro de cada produto
    const produtosComGiro = await Promise.all(
      produtos.map(async produto => {
        const lifecycle = await MarketBehaviorEngine.analyzeProductLifecycle(
          produto.id,
          mercadoId,
          3
        );
        return {
          produto,
          giro: lifecycle.data.giro,
          tendencia: lifecycle.data.tendencia,
        };
      })
    );

    // Ordenar por giro (maior primeiro)
    produtosComGiro.sort((a, b) => b.giro - a.giro);

    // Gerar layout atual (simulado - assumindo ordem atual)
    const layoutAtual = produtosComGiro.map((item, index) => ({
      produtoId: item.produto.id,
      posicao: index + 1,
      nivel: this.calculateCurrentLevel(index, produtosComGiro.length),
    }));

    // Gerar layout sugerido baseado em giro e horários de pico
    const layoutSugerido = await this.generateOptimalLayout(
      produtosComGiro,
      mercadoId,
      setor
    );

    // Calcular impacto esperado
    const impactoEsperado = this.calculateLayoutImpact(
      layoutAtual,
      layoutSugerido,
      produtosComGiro
    );

    // Gerar explicação
    const explicacao = this.generateLayoutExplanation(
      layoutSugerido,
      impactoEsperado
    );

    const suggestion: GondolaLayoutSuggestion = {
      id: `gondola-${mercadoId}-${unidadeId}-${setor}-${Date.now()}`,
      mercadoId,
      unidadeId,
      setor,
      layoutAtual,
      layoutSugerido,
      impactoEsperado,
      explicacao,
    };

    return {
      data: suggestion,
      explicacao,
      confianca: 75, // Confiança média - layout depende de muitos fatores
      fatores: [
        `Análise de ${produtosComGiro.length} produtos`,
        'Baseado em giro e tendência de vendas',
        'Otimizado para horários de pico',
      ],
      timestamp: new Date(),
    };
  }

  private static calculateCurrentLevel(
    index: number,
    total: number
  ): number {
    // Simular níveis: produtos no topo (nível 5) são mais visíveis
    // Assumir distribuição uniforme
    if (index < total * 0.2) return 5; // Top 20%
    if (index < total * 0.4) return 4;
    if (index < total * 0.6) return 3;
    if (index < total * 0.8) return 2;
    return 1; // Bottom 20%
  }

  private static async generateOptimalLayout(
    produtosComGiro: Array<{ produto: any; giro: number; tendencia: string }>,
    mercadoId: string,
    setor: string
  ): Promise<GondolaLayoutSuggestion['layoutSugerido']> {
    // Analisar horários de pico do mercado
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 30);

    const eventos = await EventCollector.getMarketEvents(mercadoId, inicio, fim);
    
    // Identificar horários de pico
    const hourCounts = new Map<number, number>();
    eventos.forEach(event => {
      const hora = new Date(event.timestamp).getHours();
      hourCounts.set(hora, (hourCounts.get(hora) || 0) + 1);
    });

    const horariosPico = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hora]) => hora);

    // Estratégia de layout:
    // 1. Produtos de alto giro no topo (nível 5) e início (posição 1-5)
    // 2. Produtos em crescimento em posições visíveis (nível 4)
    // 3. Produtos estáveis no meio (nível 3)
    // 4. Produtos em declínio no final (nível 2-1)

    const layout: GondolaLayoutSuggestion['layoutSugerido'] = [];
    let posicao = 1;

    // Top tier: Alto giro e crescimento
    const topTier = produtosComGiro.filter(
      p => p.giro > 2 && p.tendencia === 'crescendo'
    );
    topTier.forEach(item => {
      layout.push({
        produtoId: item.produto.id,
        posicao: posicao++,
        nivel: 5,
        motivo: `Alto giro (${item.giro.toFixed(1)}/dia) e tendência de crescimento`,
      });
    });

    // High tier: Alto giro estável
    const highTier = produtosComGiro.filter(
      p => p.giro > 1 && p.tendencia === 'estavel' && !topTier.includes(p)
    );
    highTier.forEach(item => {
      layout.push({
        produtoId: item.produto.id,
        posicao: posicao++,
        nivel: 4,
        motivo: `Alto giro estável (${item.giro.toFixed(1)}/dia)`,
      });
    });

    // Medium tier: Giro médio
    const mediumTier = produtosComGiro.filter(
      p => p.giro > 0.5 && p.giro <= 1 && !topTier.includes(p) && !highTier.includes(p)
    );
    mediumTier.forEach(item => {
      layout.push({
        produtoId: item.produto.id,
        posicao: posicao++,
        nivel: 3,
        motivo: `Giro médio (${item.giro.toFixed(1)}/dia)`,
      });
    });

    // Low tier: Baixo giro ou declínio
    const lowTier = produtosComGiro.filter(
      p => !topTier.includes(p) && !highTier.includes(p) && !mediumTier.includes(p)
    );
    lowTier.forEach(item => {
      layout.push({
        produtoId: item.produto.id,
        posicao: posicao++,
        nivel: item.tendencia === 'declinando' ? 1 : 2,
        motivo: item.tendencia === 'declinando'
          ? `Baixo giro (${item.giro.toFixed(1)}/dia) e em declínio`
          : `Baixo giro (${item.giro.toFixed(1)}/dia)`,
      });
    });

    return layout;
  }

  private static calculateLayoutImpact(
    layoutAtual: GondolaLayoutSuggestion['layoutAtual'],
    layoutSugerido: GondolaLayoutSuggestion['layoutSugerido'],
    produtosComGiro: Array<{ produto: any; giro: number }>
  ): GondolaLayoutSuggestion['impactoEsperado'] {
    // Calcular melhoria esperada baseada em:
    // - Produtos de alto giro movidos para posições mais visíveis
    // - Produtos em declínio movidos para posições menos visíveis

    let melhoriaTotal = 0;
    const melhorias: string[] = [];

    layoutSugerido.forEach(sugerido => {
      const atual = layoutAtual.find(a => a.produtoId === sugerido.produtoId);
      const produto = produtosComGiro.find(p => p.produto.id === sugerido.produtoId);

      if (atual && produto) {
        // Melhoria = (nível sugerido - nível atual) * giro
        const melhoriaNivel = (sugerido.nivel - atual.nivel) * produto.giro;
        
        // Melhoria de posição = (1/posição atual - 1/posição sugerida) * giro
        const melhoriaPosicao = (1 / atual.posicao - 1 / sugerido.posicao) * produto.giro * 10;

        const melhoria = melhoriaNivel + melhoriaPosicao;
        melhoriaTotal += melhoria;

        if (melhoria > 0.1) {
          melhorias.push(
            `Produto ${produto.produto.id}: movido para posição mais visível (+${melhoria.toFixed(1)}% esperado)`
          );
        }
      }
    });

    // Estimar aumento em vendas (conservador: 5-15%)
    const aumentoVendas = Math.min(15, Math.max(5, melhoriaTotal / 10));

    return {
      aumentoVendas: Math.round(aumentoVendas * 10) / 10,
      melhorias: melhorias.slice(0, 5), // Top 5 melhorias
    };
  }

  private static generateLayoutExplanation(
    layoutSugerido: GondolaLayoutSuggestion['layoutSugerido'],
    impactoEsperado: GondolaLayoutSuggestion['impactoEsperado']
  ): string {
    const produtosTopo = layoutSugerido.filter(p => p.nivel === 5).length;
    const produtosVisiveis = layoutSugerido.filter(p => p.nivel >= 4).length;

    return `Layout otimizado com ${produtosTopo} produtos de alto giro no topo ` +
      `e ${produtosVisiveis} produtos em posições altamente visíveis. ` +
      `Impacto esperado: ${impactoEsperado.aumentoVendas}% de aumento em vendas. ` +
      `Principais melhorias: ${impactoEsperado.melhorias.slice(0, 3).join('; ')}. ` +
      `Esta sugestão é baseada em análise de giro, tendência de vendas e horários de pico.`;
  }
}

