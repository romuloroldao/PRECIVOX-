/**
 * Market Health Engine
 * 
 * Calcula Health Score do Mercado (0-100)
 * 
 * Métricas:
 * - Ruptura de estoque
 * - Giro de produtos
 * - Conversão lista → compra
 * - Uso de promoções
 * - Engajamento dos usuários
 */

import { prisma } from '@/lib/prisma';
import { EventCollector } from './event-collector';
import { MarketHealthScore, AIAnalysisResult } from './types';

export class MarketHealthEngine {
  /**
   * Calcula Health Score de um mercado
   */
  static async calculateHealthScore(
    mercadoId: string,
    diasAnalise: number = 30
  ): Promise<AIAnalysisResult<MarketHealthScore>> {
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - diasAnalise);

    // Calcular cada métrica
    const rupturaEstoque = await this.calculateStockoutRate(mercadoId, inicio, fim);
    const giroProdutos = await this.calculateProductTurnover(mercadoId, inicio, fim);
    const conversaoListaCompra = await this.calculateListToPurchaseConversion(mercadoId, inicio, fim);
    const usoPromocoes = await this.calculatePromotionUsage(mercadoId, inicio, fim);
    const engajamentoUsuarios = await this.calculateUserEngagement(mercadoId, inicio, fim);

    // Calcular score baseado nas métricas
    const metricas: MarketHealthScore['metricas'] = {
      rupturaEstoque: {
        valor: rupturaEstoque,
        peso: 0.25, // 25% do score
        impacto: this.calculateImpact(rupturaEstoque, 0, 50, true), // Menor é melhor
      },
      giroProdutos: {
        valor: giroProdutos,
        peso: 0.20, // 20% do score
        impacto: this.calculateImpact(giroProdutos, 0, 10, false), // Maior é melhor
      },
      conversaoListaCompra: {
        valor: conversaoListaCompra,
        peso: 0.25, // 25% do score
        impacto: this.calculateImpact(conversaoListaCompra, 0, 100, false), // Maior é melhor
      },
      usoPromocoes: {
        valor: usoPromocoes,
        peso: 0.15, // 15% do score
        impacto: this.calculateImpact(usoPromocoes, 0, 30, false), // Ótimo entre 10-30%
      },
      engajamentoUsuarios: {
        valor: engajamentoUsuarios,
        peso: 0.15, // 15% do score
        impacto: this.calculateImpact(engajamentoUsuarios, 0, 10, false), // Maior é melhor
      },
    };

    // Calcular score final (0-100)
    const score = this.calculateFinalScore(metricas);

    // Gerar explicação
    const explicacao = this.generateHealthExplanation(score, metricas);

    // Gerar recomendações
    const recomendacoes = this.generateRecommendations(metricas);

    const healthScore: MarketHealthScore = {
      mercadoId,
      score: Math.round(score),
      dataCalculo: new Date(),
      metricas,
      explicacao,
      recomendacoes,
    };

    return {
      data: healthScore,
      explicacao,
      confianca: 85, // Alta confiança em métricas objetivas
      fatores: this.extractHealthFactors(metricas),
      timestamp: new Date(),
    };
  }

  private static async calculateStockoutRate(
    mercadoId: string,
    inicio: Date,
    fim: Date
  ): Promise<number> {
    try {
      // Buscar unidades do mercado
      const unidades = await prisma.unidades.findMany({
        where: {
          mercadoId,
        },
        select: {
          id: true,
        },
      });

      const unidadeIds = unidades.map(u => u.id);

      // Buscar produtos através das unidades
      const produtos = await prisma.produtos.findMany({
        where: {
          estoques: {
            some: {
              unidadeId: {
                in: unidadeIds,
              },
            },
          },
          ativo: true,
        },
        include: {
          estoques: true,
        },
      });

      let produtosComRuptura = 0;

      produtos.forEach(produto => {
        // Pegar estoque mais recente
        const estoquesOrdenados = produto.estoques
          ?.sort((a, b) => b.atualizadoEm.getTime() - a.atualizadoEm.getTime()) || [];
        const estoqueAtual = estoquesOrdenados[0]?.quantidade || 0;
        const estoqueMinimo = produto.pontoReposicao || 0;

        if (estoqueAtual <= estoqueMinimo) {
          produtosComRuptura++;
        }
      });

      return produtos.length > 0
        ? (produtosComRuptura / produtos.length) * 100
        : 0;
    } catch (error) {
      console.error('[HealthEngine] Erro ao calcular ruptura:', error);
      return 0;
    }
  }

  private static async calculateProductTurnover(
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

      const totalQuantidade = eventos.reduce(
        (sum, e) => sum + (e.metadata.quantidade || 0),
        0
      );

      const dias = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
      return totalQuantidade / dias;
    } catch (error) {
      console.error('[HealthEngine] Erro ao calcular giro:', error);
      return 0;
    }
  }

  private static async calculateListToPurchaseConversion(
    mercadoId: string,
    inicio: Date,
    fim: Date
  ): Promise<number> {
    try {
      const listasCriadas = await EventCollector.getMarketEvents(
        mercadoId,
        inicio,
        fim,
        'lista_criada'
      );

      const comprasRealizadas = await EventCollector.getMarketEvents(
        mercadoId,
        inicio,
        fim,
        'compra_realizada'
      );

      // Agrupar por usuário
      const usuariosComLista = new Set(listasCriadas.map(e => e.userId));
      const usuariosComCompra = new Set(comprasRealizadas.map(e => e.userId));

      let usuariosQueCompraram = 0;
      usuariosComLista.forEach(userId => {
        if (usuariosComCompra.has(userId)) {
          usuariosQueCompraram++;
        }
      });

      return listasCriadas.length > 0
        ? (usuariosQueCompraram / listasCriadas.length) * 100
        : 0;
    } catch (error) {
      console.error('[HealthEngine] Erro ao calcular conversão:', error);
      return 0;
    }
  }

  private static async calculatePromotionUsage(
    mercadoId: string,
    inicio: Date,
    fim: Date
  ): Promise<number> {
    try {
      // Buscar produtos em promoção
      // Buscar unidades do mercado
      const unidades = await prisma.unidades.findMany({
        where: {
          mercadoId,
        },
        select: {
          id: true,
        },
      });

      const unidadeIds = unidades.map(u => u.id);

      // Buscar produtos através das unidades
      const produtos = await prisma.produtos.findMany({
        where: {
          estoques: {
            some: {
              unidadeId: {
                in: unidadeIds,
              },
            },
          },
          ativo: true,
          // Assumindo que há um campo de promoção (ajustar conforme schema)
        },
      });

      // Por enquanto, retornar 0 se não houver campo de promoção
      // TODO: Implementar quando schema tiver campo de promoção
      return 0;
    } catch (error) {
      console.error('[HealthEngine] Erro ao calcular uso de promoções:', error);
      return 0;
    }
  }

  private static async calculateUserEngagement(
    mercadoId: string,
    inicio: Date,
    fim: Date
  ): Promise<number> {
    try {
      const eventos = await EventCollector.getMarketEvents(mercadoId, inicio, fim);

      // Contar usuários únicos
      const usuariosUnicos = new Set(eventos.map(e => e.userId));

      const dias = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
      return usuariosUnicos.size > 0
        ? eventos.length / usuariosUnicos.size / dias
        : 0;
    } catch (error) {
      console.error('[HealthEngine] Erro ao calcular engajamento:', error);
      return 0;
    }
  }

  private static calculateImpact(
    valor: number,
    min: number,
    max: number,
    invertido: boolean
  ): number {
    // Normalizar valor para 0-1
    const normalizado = Math.max(0, Math.min(1, (valor - min) / (max - min)));

    // Converter para impacto de -10 a +10
    const impacto = (normalizado - 0.5) * 20;

    return invertido ? -impacto : impacto;
  }

  private static calculateFinalScore(
    metricas: MarketHealthScore['metricas']
  ): number {
    let score = 50; // Base

    Object.values(metricas).forEach(metrica => {
      score += metrica.impacto * metrica.peso;
    });

    return Math.max(0, Math.min(100, score));
  }

  private static generateHealthExplanation(
    score: number,
    metricas: MarketHealthScore['metricas']
  ): string {
    const nivel = score >= 80 ? 'excelente' :
                  score >= 60 ? 'bom' :
                  score >= 40 ? 'regular' :
                  'precisa atenção';

    const pontosFortes: string[] = [];
    const pontosFracos: string[] = [];

    if (metricas.rupturaEstoque.impacto > 0) {
      pontosFortes.push('baixa ruptura de estoque');
    } else {
      pontosFracos.push(`ruptura de estoque alta (${metricas.rupturaEstoque.valor.toFixed(1)}%)`);
    }

    if (metricas.conversaoListaCompra.impacto > 0) {
      pontosFortes.push('boa conversão de listas em compras');
    } else {
      pontosFracos.push(`conversão baixa (${metricas.conversaoListaCompra.valor.toFixed(1)}%)`);
    }

    if (metricas.engajamentoUsuarios.impacto > 0) {
      pontosFortes.push('alto engajamento dos usuários');
    } else {
      pontosFracos.push('engajamento dos usuários pode melhorar');
    }

    let explicacao = `Health Score: ${score.toFixed(0)}/100 (${nivel}). `;

    if (pontosFortes.length > 0) {
      explicacao += `Pontos fortes: ${pontosFortes.join(', ')}. `;
    }

    if (pontosFracos.length > 0) {
      explicacao += `Áreas de melhoria: ${pontosFracos.join(', ')}.`;
    }

    return explicacao;
  }

  private static generateRecommendations(
    metricas: MarketHealthScore['metricas']
  ): MarketHealthScore['recomendacoes'] {
    const recomendacoes: MarketHealthScore['recomendacoes'] = [];

    // Ruptura de estoque alta
    if (metricas.rupturaEstoque.impacto < -5) {
      recomendacoes.push({
        prioridade: 'alta',
        acao: 'Reabastecer produtos com estoque baixo',
        motivo: `Ruptura de estoque em ${metricas.rupturaEstoque.valor.toFixed(1)}% dos produtos`,
        impactoEsperado: 5,
      });
    }

    // Conversão baixa
    if (metricas.conversaoListaCompra.impacto < -5) {
      recomendacoes.push({
        prioridade: 'alta',
        acao: 'Melhorar engajamento com listas de compras',
        motivo: `Apenas ${metricas.conversaoListaCompra.valor.toFixed(1)}% das listas resultam em compra`,
        impactoEsperado: 8,
      });
    }

    // Giro baixo
    if (metricas.giroProdutos.impacto < -3) {
      recomendacoes.push({
        prioridade: 'media',
        acao: 'Considerar promoções para aumentar giro',
        motivo: `Giro atual: ${metricas.giroProdutos.valor.toFixed(1)} unidades/dia`,
        impactoEsperado: 3,
      });
    }

    // Engajamento baixo
    if (metricas.engajamentoUsuarios.impacto < -3) {
      recomendacoes.push({
        prioridade: 'media',
        acao: 'Aumentar engajamento através de notificações e promoções',
        motivo: `Engajamento: ${metricas.engajamentoUsuarios.valor.toFixed(1)} eventos/usuário/dia`,
        impactoEsperado: 4,
      });
    }

    return recomendacoes;
  }

  private static extractHealthFactors(
    metricas: MarketHealthScore['metricas']
  ): string[] {
    return [
      `Ruptura de estoque: ${metricas.rupturaEstoque.valor.toFixed(1)}%`,
      `Giro de produtos: ${metricas.giroProdutos.valor.toFixed(1)} unidades/dia`,
      `Conversão lista→compra: ${metricas.conversaoListaCompra.valor.toFixed(1)}%`,
      `Uso de promoções: ${metricas.usoPromocoes.valor.toFixed(1)}%`,
      `Engajamento: ${metricas.engajamentoUsuarios.valor.toFixed(1)} eventos/usuário/dia`,
    ];
  }
}

