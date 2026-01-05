/**
 * GROOC - IA Central do Precivox
 * 
 * Responsabilidades:
 * - Responder perguntas do dono do mercado
 * - Explicar dados de forma simples
 * - Sugerir ações práticas
 * 
 * Regras:
 * - Sempre explicar o porquê da sugestão
 * - Nunca usar linguagem técnica excessiva
 * - Priorizar impacto financeiro e saúde do mercado
 */

import { MarketHealthEngine } from './health-engine';
import { PromotionEngine } from './promotion-engine';
import { MarketBehaviorEngine } from './behavior-engine';
import { ReportGenerator } from './report-generator';

export interface GroocQuestion {
  id: string;
  pergunta: string;
  contexto?: {
    mercadoId?: string;
    periodo?: string;
    produtoId?: string;
  };
}

export interface GroocAnswer {
  resposta: string;
  explicacao: string;
  acoesSugeridas?: Array<{
    acao: string;
    motivo: string;
    impactoEsperado: string;
    prioridade: 'alta' | 'media' | 'baixa';
  }>;
  dadosRelevantes?: {
    tipo: 'health_score' | 'promocao' | 'comportamento' | 'produto';
    valor: any;
  };
  confianca: number;
  fontes: string[];
}

export class GroocEngine {
  /**
   * Processa uma pergunta e retorna resposta explicável
   */
  static async answerQuestion(
    pergunta: string,
    mercadoId: string,
    userId?: string
  ): Promise<GroocAnswer> {
    const perguntaLower = pergunta.toLowerCase();

    // Categorizar pergunta
    if (this.isHealthQuestion(perguntaLower)) {
      return await this.answerHealthQuestion(pergunta, mercadoId);
    }

    if (this.isPromotionQuestion(perguntaLower)) {
      return await this.answerPromotionQuestion(pergunta, mercadoId);
    }

    if (this.isBehaviorQuestion(perguntaLower)) {
      return await this.answerBehaviorQuestion(pergunta, mercadoId, userId);
    }

    if (this.isProductQuestion(perguntaLower)) {
      return await this.answerProductQuestion(pergunta, mercadoId);
    }

    if (this.isGeneralQuestion(perguntaLower)) {
      return await this.answerGeneralQuestion(pergunta, mercadoId);
    }

    // Resposta padrão para perguntas não reconhecidas
    return {
      resposta: 'Não entendi completamente sua pergunta. Pode reformular?',
      explicacao: 'Tente fazer perguntas sobre saúde do mercado, promoções, comportamento dos clientes ou produtos específicos.',
      confianca: 30,
      fontes: [],
    };
  }

  /**
   * Verifica se é pergunta sobre saúde do mercado
   */
  private static isHealthQuestion(pergunta: string): boolean {
    const keywords = [
      'saúde', 'health', 'score', 'como está', 'situação',
      'status', 'métrica', 'indicador', 'performance'
    ];
    return keywords.some(k => pergunta.includes(k));
  }

  /**
   * Verifica se é pergunta sobre promoções
   */
  private static isPromotionQuestion(pergunta: string): boolean {
    const keywords = [
      'promoção', 'desconto', 'oferta', 'reduzir preço',
      'liquidar', 'vender mais', 'aumentar vendas'
    ];
    return keywords.some(k => pergunta.includes(k));
  }

  /**
   * Verifica se é pergunta sobre comportamento
   */
  private static isBehaviorQuestion(pergunta: string): boolean {
    const keywords = [
      'cliente', 'comportamento', 'horário', 'pico',
      'preferência', 'compra', 'padrão'
    ];
    return keywords.some(k => pergunta.includes(k));
  }

  /**
   * Verifica se é pergunta sobre produto
   */
  private static isProductQuestion(pergunta: string): boolean {
    const keywords = [
      'produto', 'estoque', 'giro', 'vendas',
      'ruptura', 'reposição'
    ];
    return keywords.some(k => pergunta.includes(k));
  }

  /**
   * Verifica se é pergunta geral
   */
  private static isGeneralQuestion(pergunta: string): boolean {
    const keywords = [
      'como', 'o que', 'quando', 'onde', 'por que',
      'ajuda', 'dica', 'sugestão'
    ];
    return keywords.some(k => pergunta.includes(k));
  }

  /**
   * Responde pergunta sobre saúde do mercado
   */
  private static async answerHealthQuestion(
    pergunta: string,
    mercadoId: string
  ): Promise<GroocAnswer> {
    const healthScore = await MarketHealthEngine.calculateHealthScore(mercadoId, 30);

    const score = healthScore.data.score;
    const nivel = score >= 80 ? 'excelente' :
                  score >= 60 ? 'bom' :
                  score >= 40 ? 'regular' :
                  'precisa atenção';

    const resposta = `A saúde do seu mercado está ${nivel} (${score}/100). ` +
      `Isso significa que ${this.explainHealthScore(score)}`;

    const acoesSugeridas = healthScore.data.recomendacoes
      .filter(r => r.prioridade === 'alta')
      .slice(0, 3)
      .map(r => ({
        acao: r.acao,
        motivo: r.motivo,
        impactoEsperado: `+${r.impactoEsperado} pontos no Health Score`,
        prioridade: r.prioridade as 'alta' | 'media' | 'baixa',
      }));

    return {
      resposta,
      explicacao: healthScore.explicacao,
      acoesSugeridas,
      dadosRelevantes: {
        tipo: 'health_score',
        valor: healthScore.data,
      },
      confianca: healthScore.confianca,
      fontes: ['Análise de métricas do mercado', 'Eventos dos últimos 30 dias'],
    };
  }

  /**
   * Responde pergunta sobre promoções
   */
  private static async answerPromotionQuestion(
    pergunta: string,
    mercadoId: string
  ): Promise<GroocAnswer> {
    const promocoes = await PromotionEngine.generatePromotionSuggestions(mercadoId, 5);

    if (promocoes.data.length === 0) {
      return {
        resposta: 'No momento, não há oportunidades claras de promoção identificadas.',
        explicacao: 'Todos os produtos estão com giro adequado e estoque equilibrado. Continue monitorando.',
        confianca: 70,
        fontes: ['Análise de giro e estoque'],
      };
    }

    const topPromocao = promocoes.data[0];
    const resposta = `Identifiquei ${promocoes.data.length} oportunidades de promoção. ` +
      `A principal é no produto ${topPromocao.produtoId}: ${topPromocao.motivo}. ` +
      `Sugiro desconto de ${topPromocao.valor}% por ${topPromocao.duracao} dias, ` +
      `o que pode aumentar as vendas em ${topPromocao.impactoEsperado.aumentoVendas}%.`;

    const acoesSugeridas = promocoes.data.slice(0, 3).map(p => ({
      acao: `Aplicar promoção de ${p.valor}% no produto ${p.produtoId}`,
      motivo: p.motivo,
      impactoEsperado: `+${p.impactoEsperado.aumentoVendas}% vendas, ${p.impactoEsperado.impactoMargem}% margem`,
      prioridade: 'media' as const,
    }));

    return {
      resposta,
      explicacao: promocoes.explicacao,
      acoesSugeridas,
      dadosRelevantes: {
        tipo: 'promocao',
        valor: promocoes.data,
      },
      confianca: promocoes.confianca,
      fontes: ['Análise de ciclo de vida dos produtos', 'Giro e estoque'],
    };
  }

  /**
   * Responde pergunta sobre comportamento
   */
  private static async answerBehaviorQuestion(
    pergunta: string,
    mercadoId: string,
    userId?: string
  ): Promise<GroocAnswer> {
    if (!userId) {
      return {
        resposta: 'Para analisar comportamento, preciso saber qual cliente você está perguntando.',
        explicacao: 'Forneça o ID do usuário ou faça uma pergunta mais específica.',
        confianca: 0,
        fontes: [],
      };
    }

    const comportamento = await MarketBehaviorEngine.analyzeUserBehavior(userId, mercadoId, 30);

    const horariosPico = comportamento.data.horariosPico.slice(0, 3);
    const topCategoria = comportamento.data.categoriasPreferidas[0];
    const intencao = comportamento.data.intencaoCompra;

    const resposta = `Este cliente tem padrão de compra interessante. ` +
      `Horários de maior atividade: ${horariosPico.map(h => `${h.hora}h`).join(', ')}. ` +
      (topCategoria ? `Categoria preferida: ${topCategoria.categoriaId}. ` : '') +
      `Intenção de compra atual: ${intencao.score}/100. ` +
      `Isso significa que ${this.explainPurchaseIntent(intencao.score)}`;

    return {
      resposta,
      explicacao: comportamento.explicacao,
      dadosRelevantes: {
        tipo: 'comportamento',
        valor: comportamento.data,
      },
      confianca: comportamento.confianca,
      fontes: ['Análise de eventos do usuário', 'Padrões de compra'],
    };
  }

  /**
   * Responde pergunta sobre produto
   */
  private static async answerProductQuestion(
    pergunta: string,
    mercadoId: string
  ): Promise<GroocAnswer> {
    // Extrair ID do produto se mencionado
    const produtoIdMatch = pergunta.match(/produto\s+(\w+)/i);
    const produtoId = produtoIdMatch ? produtoIdMatch[1] : null;

    if (!produtoId) {
      return {
        resposta: 'Para analisar um produto específico, mencione o ID do produto na pergunta.',
        explicacao: 'Exemplo: "Como está o produto PROD-123?"',
        confianca: 0,
        fontes: [],
      };
    }

    const lifecycle = await MarketBehaviorEngine.analyzeProductLifecycle(produtoId, mercadoId, 6);

    const resposta = `O produto ${produtoId} está em fase de ${lifecycle.data.fase}. ` +
      `Giro atual: ${lifecycle.data.giro.toFixed(1)} unidades por dia. ` +
      `Tendência: ${lifecycle.data.tendencia}. ` +
      `${this.explainProductPhase(lifecycle.data.fase, lifecycle.data.giro)}`;

    const acoesSugeridas: GroocAnswer['acoesSugeridas'] = [];

    if (lifecycle.data.fase === 'declinio') {
      acoesSugeridas.push({
        acao: 'Considerar promoção para liquidar estoque',
        motivo: 'Produto em declínio com baixo giro',
        impactoEsperado: 'Aumentar giro e liberar espaço',
        prioridade: 'media',
      });
    }

    if (lifecycle.data.fase === 'introducao' && lifecycle.data.giro < 1) {
      acoesSugeridas.push({
        acao: 'Promover produto para aumentar visibilidade',
        motivo: 'Produto novo com baixo giro inicial',
        impactoEsperado: 'Aumentar conhecimento e vendas',
        prioridade: 'alta',
      });
    }

    return {
      resposta,
      explicacao: lifecycle.explicacao,
      acoesSugeridas,
      dadosRelevantes: {
        tipo: 'produto',
        valor: lifecycle.data,
      },
      confianca: lifecycle.confianca,
      fontes: ['Análise de ciclo de vida', 'Histórico de vendas'],
    };
  }

  /**
   * Responde pergunta geral
   */
  private static async answerGeneralQuestion(
    pergunta: string,
    mercadoId: string
  ): Promise<GroocAnswer> {
    // Gerar relatório para contexto
    const report = await ReportGenerator.generateWeeklyReport(mercadoId);

    const resposta = `Com base na análise do seu mercado, posso ajudar com: ` +
      `saúde do mercado (score atual: ${report.data.resumo.score}/100), ` +
      `sugestões de promoção (${report.data.sugestoesPromocao.length} oportunidades), ` +
      `e insights de comportamento. ` +
      `O que você gostaria de saber especificamente?`;

    return {
      resposta,
      explicacao: 'Posso responder perguntas sobre saúde do mercado, promoções, comportamento dos clientes ou produtos específicos.',
      acoesSugeridas: [
        {
          acao: 'Ver Health Score completo',
          motivo: 'Entender situação geral do mercado',
          impactoEsperado: 'Visão clara da saúde do negócio',
          prioridade: 'alta',
        },
        {
          acao: 'Revisar sugestões de promoção',
          motivo: 'Identificar oportunidades de aumento de vendas',
          impactoEsperado: 'Aumentar receita',
          prioridade: 'media',
        },
      ],
      dadosRelevantes: {
        tipo: 'health_score',
        valor: report.data,
      },
      confianca: 60,
      fontes: ['Relatório semanal do mercado'],
    };
  }

  // Métodos auxiliares para explicações simples

  private static explainHealthScore(score: number): string {
    if (score >= 80) {
      return 'seu mercado está operando muito bem, com baixa ruptura de estoque, bom giro e clientes engajados.';
    } else if (score >= 60) {
      return 'seu mercado está em boa forma, mas há algumas áreas que podem melhorar para aumentar ainda mais a performance.';
    } else if (score >= 40) {
      return 'seu mercado precisa de atenção em algumas áreas importantes para melhorar a saúde geral.';
    } else {
      return 'seu mercado precisa de ações imediatas para melhorar a saúde. Foque nas recomendações prioritárias.';
    }
  }

  private static explainPurchaseIntent(score: number): string {
    if (score >= 70) {
      return 'há alta probabilidade de compra em breve. Cliente está ativamente pesquisando e adicionando itens à lista.';
    } else if (score >= 50) {
      return 'há interesse moderado. Cliente está explorando opções mas ainda não decidiu comprar.';
    } else {
      return 'o cliente está apenas navegando. Pode precisar de mais estímulo ou tempo para decidir.';
    }
  }

  private static explainProductPhase(
    fase: string,
    giro: number
  ): string {
    if (fase === 'introducao') {
      return 'É normal ter giro baixo no início. Considere promoções para aumentar visibilidade.';
    } else if (fase === 'crescimento') {
      return 'Produto está ganhando tração. Mantenha estoque adequado para não perder vendas.';
    } else if (fase === 'maturidade') {
      return 'Produto está estável. Foque em manter qualidade e preço competitivo.';
    } else {
      return 'Produto está em declínio. Considere promoções para liquidar estoque ou reposicionamento.';
    }
  }
}

