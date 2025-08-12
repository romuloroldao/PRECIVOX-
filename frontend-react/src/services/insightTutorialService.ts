// services/insightTutorialService.ts - IA para gerar tutoriais passo-a-passo
import { useToast } from '../hooks/useToast';

export interface StepByStepTutorial {
  id: string;
  title: string;
  description: string;
  priority: 'alta' | 'media' | 'baixa';
  estimatedTime: string;
  difficulty: 'facil' | 'medio' | 'dificil';
  category: string;
  steps: TutorialStep[];
  resources: TutorialResource[];
  expectedResults: string[];
  metrics: TutorialMetric[];
}

export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  actions: string[];
  tips: string[];
  warnings?: string[];
  screenshots?: string[];
  duration: string;
  isCompleted?: boolean;
}

export interface TutorialResource {
  type: 'link' | 'download' | 'contact' | 'video';
  title: string;
  description: string;
  url?: string;
  icon: string;
}

export interface TutorialMetric {
  name: string;
  description: string;
  target: string;
  measurement: string;
}

class InsightTutorialService {
  private static instance: InsightTutorialService;
  
  public static getInstance(): InsightTutorialService {
    if (!InsightTutorialService.instance) {
      InsightTutorialService.instance = new InsightTutorialService();
    }
    return InsightTutorialService.instance;
  }

  // IA que gera tutoriais baseados no insight e perfil do usuário
  async generateTutorial(insight: any, marketContext?: any): Promise<StepByStepTutorial> {
    console.log('🧠 Gerando tutorial para insight:', insight.title || insight.titulo);
    console.log('👤 Perfil do usuário:', marketContext?.userRole);
    console.log('📋 Dados do insight:', insight);
    console.log('🏪 Contexto do mercado:', marketContext);
    
    try {
      // Simular tempo de processamento da IA
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // IA contextual baseada no tipo de insight e perfil
      return this.generateContextualTutorial(insight, marketContext);
    } catch (error) {
      console.error('❌ Erro interno na geração do tutorial:', error);
      throw error;
    }
  }

  private generateContextualTutorial(insight: any, marketContext?: any): StepByStepTutorial {
    // Determinar se é ADMIN ou GESTOR
    const isAdmin = marketContext?.userRole === 'admin';
    
    if (isAdmin) {
      // Tutoriais específicos para administradores do PRECIVOX
      return this.generateAdminTutorial(insight, marketContext);
    } else {
      // Tutoriais específicos para gestores de mercado
      const tutorialTemplates = {
        'preco_alto': this.generatePricingOptimizationTutorial(insight, marketContext),
        'estoque_baixo': this.generateInventoryManagementTutorial(insight, marketContext),
        'categoria_popular': this.generateCategoryExpansionTutorial(insight, marketContext),
        'concorrencia': this.generateCompetitiveAnalysisTutorial(insight, marketContext),
        'sazonalidade': this.generateSeasonalPlanningTutorial(insight, marketContext),
        'tendencia_crescimento': this.generateGrowthStrategyTutorial(insight, marketContext),
        'oportunidade_promocao': this.generatePromotionTutorial(insight, marketContext),
        'default': this.generateGenericTutorial(insight, marketContext)
      };

      const tutorialType = this.detectInsightType(insight);
      return tutorialTemplates[tutorialType] || tutorialTemplates['default'];
    }
  }

  private detectInsightType(insight: any): string {
    const title = (insight.title || insight.titulo || '').toLowerCase();
    const description = (insight.description || insight.descricao || '').toLowerCase();
    
    console.log('🔍 Detectando tipo de insight:', { title, description });
    
    if (title.includes('preço') || title.includes('caro') || description.includes('preço acima')) {
      return 'preco_alto';
    }
    if (title.includes('estoque') || title.includes('produto em falta')) {
      return 'estoque_baixo';
    }
    if (title.includes('categoria') && title.includes('popular')) {
      return 'categoria_popular';
    }
    if (title.includes('concorrente') || title.includes('competitivo')) {
      return 'concorrencia';
    }
    if (title.includes('sazonal') || title.includes('temporada')) {
      return 'sazonalidade';
    }
    if (title.includes('crescimento') || title.includes('oportunidade')) {
      return 'tendencia_crescimento';
    }
    if (title.includes('promoção') || title.includes('desconto')) {
      return 'oportunidade_promocao';
    }
    
    console.log('🎯 Tipo detectado: default (não encontrou padrão específico)');
    return 'default';
  }

  private generatePricingOptimizationTutorial(insight: any, context?: any): StepByStepTutorial {
    return {
      id: `tutorial_${Date.now()}`,
      title: 'Como Otimizar Preços de Produtos',
      description: 'Tutorial completo para ajustar preços e manter competitividade sem perder margem de lucro.',
      priority: 'alta',
      estimatedTime: '30-45 minutos',
      difficulty: 'medio',
      category: 'Estratégia de Preços',
      steps: [
        {
          id: 1,
          title: 'Análise da Situação Atual',
          description: 'Identifique quais produtos estão com preços desalinhados',
          actions: [
            'Acesse seu sistema de gestão de estoque',
            'Gere relatório de produtos por categoria',
            'Compare preços com a média da região (use PRECIVOX como referência)',
            'Identifique produtos com preços 15% acima da concorrência'
          ],
          tips: [
            'Foque nos produtos de maior giro primeiro',
            'Considere a margem de lucro atual antes de reduzir preços',
            'Produtos essenciais têm menos elasticidade de preço'
          ],
          warnings: [
            'Não reduza preços drasticamente de uma vez só',
            'Considere o custo de reposição dos produtos'
          ],
          duration: '10 minutos'
        },
        {
          id: 2,
          title: 'Definição de Nova Estratégia',
          description: 'Crie uma estratégia de precificação baseada em dados',
          actions: [
            'Calcule a margem mínima necessária para cada produto',
            'Defina preços competitivos mas lucrativos',
            'Crie grupos de produtos por estratégia (competitivo, premium, popular)',
            'Prepare planilha com novos preços'
          ],
          tips: [
            'Use a regra 80/20: 20% dos produtos geram 80% da receita',
            'Considere pacotes e combos para aumentar ticket médio',
            'Produtos de primeira necessidade podem ter margem menor'
          ],
          duration: '15 minutos'
        },
        {
          id: 3,
          title: 'Implementação Gradual',
          description: 'Aplique os novos preços de forma estratégica',
          actions: [
            'Implemente mudanças em lotes pequenos (10-20 produtos por vez)',
            'Comunique mudanças para equipe de vendas',
            'Atualize etiquetas e sistema de PDV',
            'Monitore reação dos clientes nos primeiros dias'
          ],
          tips: [
            'Comece com produtos de menor impacto',
            'Treine equipe para explicar mudanças aos clientes',
            'Considere promoções para produtos com preço reduzido'
          ],
          duration: '10 minutos'
        },
        {
          id: 4,
          title: 'Monitoramento e Ajustes',
          description: 'Acompanhe resultados e faça correções necessárias',
          actions: [
            'Monitore vendas diárias dos produtos alterados',
            'Compare com período anterior',
            'Ajuste preços se necessário',
            'Documente lições aprendidas'
          ],
          tips: [
            'Use métricas: volume de vendas, margem total, satisfação cliente',
            'Considere feedback da equipe de vendas',
            'Mantenha registro das mudanças para análise futura'
          ],
          duration: '10 minutos'
        }
      ],
      resources: [
        {
          type: 'link',
          title: 'Comparador de Preços PRECIVOX',
          description: 'Use nossa plataforma para monitorar preços da concorrência',
          url: '/search',
          icon: '📊'
        },
        {
          type: 'download',
          title: 'Planilha de Controle de Preços',
          description: 'Template para organizar sua estratégia de preços',
          icon: '📋'
        },
        {
          type: 'video',
          title: 'Vídeo: Estratégias de Precificação',
          description: 'Tutorial em vídeo sobre precificação inteligente',
          icon: '🎥'
        },
        {
          type: 'contact',
          title: 'Suporte PRECIVOX',
          description: 'Fale com nossos especialistas em precificação',
          icon: '💬'
        }
      ],
      expectedResults: [
        'Aumento de 5-15% no volume de vendas dos produtos ajustados',
        'Melhoria na competitividade sem perda significativa de margem',
        'Maior satisfação dos clientes com preços mais justos',
        'Processo estruturado para futuras mudanças de preço'
      ],
      metrics: [
        {
          name: 'Volume de Vendas',
          description: 'Quantidade vendida antes vs depois',
          target: '+10% em 30 dias',
          measurement: 'Unidades vendidas/mês'
        },
        {
          name: 'Margem Bruta',
          description: 'Margem de lucro mantida',
          target: 'Manter >15%',
          measurement: '(Receita - Custo)/Receita'
        },
        {
          name: 'Competitividade',
          description: 'Posição versus concorrência',
          target: 'Top 3 na região',
          measurement: 'Ranking PRECIVOX'
        }
      ]
    };
  }

  private generateInventoryManagementTutorial(insight: any, context?: any): StepByStepTutorial {
    return {
      id: `tutorial_${Date.now()}`,
      title: 'Gestão Inteligente de Estoque',
      description: 'Como evitar produtos em falta e otimizar seu capital de giro.',
      priority: 'alta',
      estimatedTime: '25-40 minutos',
      difficulty: 'medio',
      category: 'Gestão de Estoque',
      steps: [
        {
          id: 1,
          title: 'Análise de Produtos em Falta/Baixo Estoque',
          description: 'Identifique padrões nos produtos que ficam sem estoque',
          actions: [
            'Liste produtos que ficaram em falta nos últimos 30 dias',
            'Identifique produtos com estoque abaixo de 7 dias de venda',
            'Analise sazonalidade e demanda histórica',
            'Calcule o impacto financeiro das faltas'
          ],
          tips: [
            'Priorize produtos de alto giro e alta margem',
            'Considere lead time dos fornecedores',
            'Use dados do PRECIVOX para ver demanda regional'
          ],
          duration: '10 minutos'
        },
        {
          id: 2,
          title: 'Implementar Sistema de Ponto de Pedido',
          description: 'Crie alertas automáticos para reposição',
          actions: [
            'Calcule ponto de pedido para cada produto crítico',
            'Configure alertas no seu sistema (ou planilha)',
            'Defina estoque de segurança baseado na variação da demanda',
            'Estabeleça processo de compras emergenciais'
          ],
          tips: [
            'Fórmula: Ponto de Pedido = (Demanda média × Lead time) + Estoque de segurança',
            'Revise pontos de pedido mensalmente',
            'Considere promoções e eventos sazonais'
          ],
          duration: '15 minutos'
        },
        {
          id: 3,
          title: 'Otimizar Relacionamento com Fornecedores',
          description: 'Melhore prazos e condições de compra',
          actions: [
            'Negocie prazos de entrega menores com fornecedores principais',
            'Estabeleça contratos com entregas programadas',
            'Desenvolva fornecedores alternativos para produtos críticos',
            'Crie sistema de avaliação de fornecedores'
          ],
          tips: [
            'Mantenha bom relacionamento pagando em dia',
            'Concentre compras para ter poder de negociação',
            'Visite fornecedores para conhecer operação'
          ],
          duration: '15 minutos'
        }
      ],
      resources: [
        {
          type: 'download',
          title: 'Calculadora de Ponto de Pedido',
          description: 'Planilha para calcular quando comprar cada produto',
          icon: '🧮'
        },
        {
          type: 'link',
          title: 'Dashboard de Demanda PRECIVOX',
          description: 'Veja tendências de demanda na sua região',
          url: '/dashboard',
          icon: '📈'
        }
      ],
      expectedResults: [
        'Redução de 70% nos produtos em falta',
        'Melhoria no giro de estoque',
        'Redução do capital parado em estoque',
        'Maior satisfação dos clientes'
      ],
      metrics: [
        {
          name: 'Nível de Serviço',
          description: 'Percentual de demanda atendida',
          target: '>95%',
          measurement: 'Vendas realizadas / Vendas solicitadas'
        },
        {
          name: 'Giro de Estoque',
          description: 'Quantas vezes o estoque roda por mês',
          target: '2-4x por mês',
          measurement: 'Vendas mensais / Estoque médio'
        }
      ]
    };
  }

  // Tutoriais específicos para administradores do PRECIVOX
  private generateAdminTutorial(insight: any, context?: any): StepByStepTutorial {
    const adminTutorialType = this.detectAdminInsightType(insight);
    
    const adminTutorials = {
      'plataforma_performance': this.generatePlatformPerformanceTutorial(insight, context),
      'usuario_engajamento': this.generateUserEngagementTutorial(insight, context), 
      'mercado_expansao': this.generateMarketExpansionTutorial(insight, context),
      'dados_qualidade': this.generateDataQualityTutorial(insight, context),
      'sistema_otimizacao': this.generateSystemOptimizationTutorial(insight, context),
      'default_admin': this.generateGenericAdminTutorial(insight, context)
    };
    
    return adminTutorials[adminTutorialType] || adminTutorials['default_admin'];
  }

  private detectAdminInsightType(insight: any): string {
    const title = (insight.title || insight.titulo || '').toLowerCase();
    const description = (insight.description || insight.descricao || '').toLowerCase();
    
    console.log('🔍 Detectando tipo de insight ADMIN:', { title, description });
    
    if (title.includes('performance') || title.includes('lentidão') || description.includes('sistema lento')) {
      return 'plataforma_performance';
    }
    if (title.includes('usuário') || title.includes('engajamento') || title.includes('ativo')) {
      return 'usuario_engajamento';
    }
    if (title.includes('mercado') && (title.includes('novo') || title.includes('expansão'))) {
      return 'mercado_expansao';
    }
    if (title.includes('dados') || title.includes('qualidade') || title.includes('inconsistência')) {
      return 'dados_qualidade';
    }
    if (title.includes('otimização') || title.includes('sistema') || title.includes('recurso')) {
      return 'sistema_otimizacao';
    }
    
    console.log('🎯 Tipo ADMIN detectado: default_admin');
    return 'default_admin';
  }

  private generatePlatformPerformanceTutorial(insight: any, context?: any): StepByStepTutorial {
    return {
      id: `admin_tutorial_${Date.now()}`,
      title: 'Otimização de Performance da Plataforma',
      description: 'Como identificar e resolver gargalos de performance no PRECIVOX.',
      priority: 'alta',
      estimatedTime: '45-60 minutos',
      difficulty: 'dificil',
      category: 'Administração Técnica',
      steps: [
        {
          id: 1,
          title: 'Monitoramento de Métricas do Sistema',
          description: 'Identifique gargalos através do painel de administração',
          actions: [
            'Acesse o painel de métricas do sistema admin',
            'Verifique uso de CPU, memória e disco dos servidores',
            'Analise logs de erro e tempo de resposta das APIs',
            'Identifique picos de uso e horários críticos'
          ],
          tips: [
            'Foque em métricas que afetam experiência do usuário',
            'Compare dados de diferentes períodos para identificar tendências',
            'Priorize problemas que afetam múltiplos usuários'
          ],
          warnings: [
            'Não faça alterações em produção sem backup',
            'Teste mudanças em ambiente de desenvolvimento primeiro'
          ],
          duration: '15 minutos'
        },
        {
          id: 2,
          title: 'Otimização de Banco de Dados',
          description: 'Melhore consultas e índices para maior performance',
          actions: [
            'Execute análise de consultas lentas no PostgreSQL',
            'Identifique consultas que consomem mais recursos',
            'Revise índices existentes e crie novos se necessário',
            'Implemente cache para consultas frequentes'
          ],
          tips: [
            'Use EXPLAIN ANALYZE para entender planos de execução',
            'Consultas com JOIN complexos são candidatas a otimização',
            'Cache funciona bem para dados que mudam pouco'
          ],
          duration: '20 minutos'
        },
        {
          id: 3,
          title: 'Configuração de Cache e CDN',
          description: 'Implemente estratégias de cache para reduzir carga',
          actions: [
            'Configure cache de aplicação (Redis/Memcached)',
            'Otimize cache de arquivos estáticos',
            'Implemente compressão gzip nos servidores',
            'Configure TTL adequado para diferentes tipos de dados'
          ],
          tips: [
            'Dados de produtos podem ter cache mais longo',
            'Dados de usuário precisam cache mais curto',
            'Monitor taxa de hit/miss do cache'
          ],
          duration: '15 minutos'
        }
      ],
      resources: [
        {
          type: 'link',
          title: 'Painel de Métricas Admin',
          description: 'Dashboard completo de performance do sistema',
          url: '/admin/metrics',
          icon: '📊'
        },
        {
          type: 'download',
          title: 'Guia de Otimização PostgreSQL',
          description: 'Manual técnico para otimização de banco',
          icon: '🗄️'
        },
        {
          type: 'contact',
          title: 'Suporte Técnico',
          description: 'Equipe de DevOps para questões complexas',
          icon: '🛠️'
        }
      ],
      expectedResults: [
        'Redução de 30-50% no tempo de resposta das APIs',
        'Melhoria na experiência dos usuários finais',
        'Redução de custos de infraestrutura',
        'Sistema mais estável e escalável'
      ],
      metrics: [
        {
          name: 'Tempo de Resposta API',
          description: 'Tempo médio de resposta das principais APIs',
          target: '<200ms',
          measurement: 'Millisegundos'
        },
        {
          name: 'Taxa de Erro',
          description: 'Percentual de requisições com erro',
          target: '<1%',
          measurement: 'Percentual'
        }
      ]
    };
  }

  private generateUserEngagementTutorial(insight: any, context?: any): StepByStepTutorial {
    return {
      id: `admin_tutorial_${Date.now()}`,
      title: 'Estratégias para Aumentar Engajamento de Usuários',
      description: 'Como analisar e melhorar o engajamento de gestores na plataforma.',
      priority: 'media',
      estimatedTime: '30-45 minutos',
      difficulty: 'medio',
      category: 'Gestão de Usuários',
      steps: [
        {
          id: 1,
          title: 'Análise de Métricas de Engajamento',
          description: 'Identifique padrões de uso e pontos de abandono',
          actions: [
            'Acesse relatórios de uso por usuário no painel admin',
            'Identifique usuários ativos vs inativos',
            'Analise jornada do usuário e pontos de saída',
            'Verifique frequência de login e tempo de sessão'
          ],
          tips: [
            'Usuários que não logam há 30+ dias precisam reativação',
            'Sessões muito curtas indicam problemas de UX',
            'Compare métricas por tipo de usuário (gestor vs admin)'
          ],
          duration: '15 minutos'
        },
        {
          id: 2,
          title: 'Implementação de Campanhas de Reativação',
          description: 'Crie estratégias para trazer usuários de volta',
          actions: [
            'Segmente usuários por nível de engajamento',
            'Crie campanhas de email personalizadas',
            'Implemente notificações push relevantes',
            'Ofereça tutoriais e onboarding para usuários perdidos'
          ],
          tips: [
            'Personalize mensagens baseado no perfil do usuário',
            'Foque em valor: mostre benefícios específicos',
            'Teste diferentes horários e frequências'
          ],
          duration: '20 minutos'
        }
      ],
      resources: [
        {
          type: 'link',
          title: 'Analytics de Usuários',
          description: 'Dashboard detalhado de comportamento dos usuários',
          url: '/admin/users/analytics',
          icon: '👥'
        }
      ],
      expectedResults: [
        'Aumento de 20-30% na retenção de usuários',
        'Maior frequência de uso da plataforma',
        'Redução de churn de usuários pagantes'
      ],
      metrics: [
        {
          name: 'Taxa de Retenção',
          description: 'Usuários ativos no mês',
          target: '>70%',
          measurement: 'Percentual'
        }
      ]
    };
  }

  private generateGenericAdminTutorial(insight: any, context?: any): StepByStepTutorial {
    return {
      id: `admin_tutorial_${Date.now()}`,
      title: `Administração: ${insight.title}`,
      description: 'Tutorial administrativo baseado no insight identificado pela IA.',
      priority: insight.impact?.toLowerCase() as 'alta' | 'media' | 'baixa' || 'media',
      estimatedTime: '20-30 minutos',
      difficulty: 'medio',
      category: 'Administração Geral',
      steps: [
        {
          id: 1,
          title: 'Análise do Problema Administrativo',
          description: 'Entenda o impacto no sistema e usuários',
          actions: [
            'Acesse dados específicos no painel administrativo',
            'Identifique usuários ou mercados afetados',
            'Calcule impacto em métricas de negócio',
            'Priorize baseado em urgência e impacto'
          ],
          tips: [
            'Use dados da plataforma para basear decisões',
            'Considere impacto em usuários pagantes primeiro',
            'Envolva equipe técnica para soluções complexas'
          ],
          duration: '10 minutos'
        },
        {
          id: 2,
          title: 'Implementação de Solução',
          description: 'Execute mudanças necessárias no sistema',
          actions: [
            'Implemente correções ou melhorias identificadas',
            'Monitore métricas durante implementação',
            'Comunique mudanças para usuários afetados',
            'Documente solução para casos futuros'
          ],
          tips: [
            'Teste mudanças em ambiente controlado primeiro',
            'Mantenha backup de configurações importantes',
            'Monitore feedback dos usuários pós-implementação'
          ],
          duration: '15 minutos'
        }
      ],
      resources: [
        {
          type: 'link',
          title: 'Painel Administrativo',
          description: 'Centro de controle da plataforma PRECIVOX',
          url: '/admin',
          icon: '⚙️'
        },
        {
          type: 'contact',
          title: 'Equipe Técnica',
          description: 'Suporte especializado para questões complexas',
          icon: '🤝'
        }
      ],
      expectedResults: [
        'Resolução do problema identificado',
        'Melhoria nas métricas administrativas',
        'Maior satisfação dos usuários da plataforma'
      ],
      metrics: [
        {
          name: 'Resolução do Problema',
          description: 'Melhoria no indicador específico',
          target: 'Definir baseado no insight',
          measurement: 'Métrica específica do problema'
        }
      ]
    };
  }

  private generateGenericTutorial(insight: any, context?: any): StepByStepTutorial {
    const title = insight.title || insight.titulo || 'Insight Personalizado';
    const priority = (insight.priority || insight.prioridade || insight.impact || 'media').toString().toLowerCase();
    
    return {
      id: `tutorial_${Date.now()}`,
      title: `Como Resolver: ${title}`,
      description: `Tutorial personalizado baseado na análise da sua situação específica.`,
      priority: priority as 'alta' | 'media' | 'baixa',
      estimatedTime: '20-30 minutos',
      difficulty: 'medio',
      category: 'Melhoria Geral',
      steps: [
        {
          id: 1,
          title: 'Análise da Situação',
          description: 'Entenda o problema identificado pela IA',
          actions: [
            'Revise os dados que geraram este insight',
            'Identifique o impacto atual no seu negócio',
            'Liste recursos necessários para resolução',
            'Defina prioridade e cronograma'
          ],
          tips: [
            'Use dados concretos do PRECIVOX para basear decisões',
            'Considere impacto vs esforço necessário',
            'Envolva sua equipe no planejamento'
          ],
          duration: '10 minutos'
        },
        {
          id: 2,
          title: 'Implementação',
          description: 'Execute as ações necessárias',
          actions: [
            'Implemente as mudanças necessárias',
            'Monitore os resultados iniciais',
            'Ajuste a estratégia conforme necessário',
            'Documente o processo'
          ],
          tips: [
            'Comece com mudanças pequenas e mensuráveis',
            'Mantenha equipe informada sobre mudanças',
            'Use feedback dos clientes para ajustes'
          ],
          duration: '15 minutos'
        }
      ],
      resources: [
        {
          type: 'link',
          title: 'Suporte PRECIVOX',
          description: 'Nossa equipe pode ajudar com implementação',
          url: '/contato',
          icon: '🤝'
        }
      ],
      expectedResults: [
        'Resolução do problema identificado',
        'Melhoria nos indicadores relacionados',
        'Processo documentado para situações similares'
      ],
      metrics: [
        {
          name: 'Resolução do Problema',
          description: 'Melhoria no indicador específico',
          target: 'Definir baseado no insight',
          measurement: 'Métrica específica do problema'
        }
      ]
    };
  }

  // Método para marcar passo como concluído
  markStepCompleted(tutorialId: string, stepId: number): void {
    // Implementar persistência local ou no backend
    const completedSteps = this.getCompletedSteps(tutorialId);
    completedSteps.add(stepId);
    localStorage.setItem(`tutorial_${tutorialId}_steps`, JSON.stringify([...completedSteps]));
  }

  // Obter passos concluídos
  getCompletedSteps(tutorialId: string): Set<number> {
    const stored = localStorage.getItem(`tutorial_${tutorialId}_steps`);
    return new Set(stored ? JSON.parse(stored) : []);
  }

  // Calcular progresso do tutorial
  getTutorialProgress(tutorial: StepByStepTutorial): number {
    const completedSteps = this.getCompletedSteps(tutorial.id);
    return (completedSteps.size / tutorial.steps.length) * 100;
  }
}

export const insightTutorialService = InsightTutorialService.getInstance();
export default insightTutorialService;