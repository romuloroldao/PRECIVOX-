/**
 * Tipos e Interfaces para Sistema de IA do Precivox
 * 
 * Princípios:
 * - IA baseada em comportamento, não em pagamento
 * - IA explicável (nunca caixa-preta)
 * - IA consome dados e eventos, não UI
 */

/**
 * Eventos que a IA consome
 */
export type UserEventType =
  | 'lista_criada'
  | 'produto_adicionado_lista'
  | 'produto_removido_lista'
  | 'produto_buscado'
  | 'produto_visualizado'
  | 'compra_realizada'
  | 'promocao_visualizada'
  | 'horario_acesso';

export interface UserEvent {
  id: string;
  userId: string;
  mercadoId: string;
  type: UserEventType;
  timestamp: Date;
  metadata: {
    produtoId?: string;
    categoriaId?: string;
    quantidade?: number;
    preco?: number;
    listaId?: string;
    searchQuery?: string;
    [key: string]: any;
  };
}

/**
 * Perfil de comportamento do usuário
 */
export interface UserBehaviorProfile {
  userId: string;
  mercadoId: string;
  horariosPico: {
    diaSemana: number; // 0-6 (domingo-sábado)
    hora: number; // 0-23
    frequencia: number;
  }[];
  categoriasPreferidas: {
    categoriaId: string;
    frequencia: number;
    ultimaInteracao: Date;
  }[];
  produtosFrequentes: {
    produtoId: string;
    frequencia: number;
    ultimaCompra: Date;
  }[];
  padraoCompras: {
    diasEntreCompras: number;
    valorMedio: number;
    itensMedios: number;
  };
  intencaoCompra: {
    score: number; // 0-100
    fatores: string[];
    confianca: number; // 0-100
  };
}

/**
 * Ciclo de vida do produto
 */
export interface ProductLifecycle {
  produtoId: string;
  mercadoId: string;
  fase: 'introducao' | 'crescimento' | 'maturidade' | 'declinio';
  giro: number; // unidades por período
  tendencia: 'crescendo' | 'estavel' | 'declinando';
  sazonalidade: {
    mes: number;
    multiplicador: number; // 1.0 = normal, 1.5 = 50% acima
  }[];
  explicacao: string; // Por que está nesta fase
}

/**
 * Sugestão de promoção
 */
export interface PromotionSuggestion {
  id: string;
  produtoId: string;
  mercadoId: string;
  tipo: 'desconto_percentual' | 'desconto_fixo' | 'compre_ganhe' | 'pacote';
  valor: number; // percentual ou valor fixo
  duracao: number; // dias
  motivo: string; // Explicação do motivo
  impactoEsperado: {
    aumentoVendas: number; // percentual
    impactoMargem: number; // percentual
    impactoGiro: number; // unidades
  };
  confianca: number; // 0-100
  fatores: string[]; // Fatores que levaram à sugestão
  abTestSugerido?: {
    grupoA: number; // percentual de desconto
    grupoB: number; // percentual de desconto
    duracao: number; // dias
  };
}

/**
 * Health Score do Mercado
 */
export interface MarketHealthScore {
  mercadoId: string;
  score: number; // 0-100
  dataCalculo: Date;
  metricas: {
    rupturaEstoque: {
      valor: number; // percentual
      peso: number;
      impacto: number; // -10 a +10
    };
    giroProdutos: {
      valor: number; // unidades/dia
      peso: number;
      impacto: number;
    };
    conversaoListaCompra: {
      valor: number; // percentual
      peso: number;
      impacto: number;
    };
    usoPromocoes: {
      valor: number; // percentual de produtos em promoção
      peso: number;
      impacto: number;
    };
    engajamentoUsuarios: {
      valor: number; // eventos por usuário/dia
      peso: number;
      impacto: number;
    };
  };
  explicacao: string; // Explicação do score
  recomendacoes: {
    prioridade: 'alta' | 'media' | 'baixa';
    acao: string;
    motivo: string;
    impactoEsperado: number; // pontos no score
  }[];
}

/**
 * Sugestão de layout de gôndola
 */
export interface GondolaLayoutSuggestion {
  id: string;
  mercadoId: string;
  unidadeId: string;
  setor: string;
  layoutAtual: {
    produtoId: string;
    posicao: number; // ordem na gôndola
    nivel: number; // altura (1-5)
  }[];
  layoutSugerido: {
    produtoId: string;
    posicao: number;
    nivel: number;
    motivo: string; // Por que esta posição
  }[];
  impactoEsperado: {
    aumentoVendas: number; // percentual
    melhorias: string[];
  };
  explicacao: string; // Explicação geral do layout
}

/**
 * Relatório Semanal de Saúde do Mercado
 */
export interface WeeklyMarketReport {
  mercadoId: string;
  periodo: {
    inicio: Date;
    fim: Date;
  };
  resumo: {
    score: number;
    tendencia: 'melhorando' | 'estavel' | 'piorando';
    variacao: number; // pontos em relação à semana anterior
  };
  metricas: MarketHealthScore['metricas'];
  topInsights: {
    tipo: 'promocao' | 'estoque' | 'layout' | 'produto';
    titulo: string;
    descricao: string;
    impacto: number;
    acaoSugerida: string;
  }[];
  sugestoesPromocao: PromotionSuggestion[];
  sugestoesLayout: GondolaLayoutSuggestion[];
  explicacao: string; // Resumo textual explicável
}

/**
 * Resultado de análise com explicação
 */
export interface AIAnalysisResult<T> {
  data: T;
  explicacao: string; // Sempre presente - nunca caixa-preta
  confianca: number; // 0-100
  fatores: string[]; // Fatores que influenciaram o resultado
  timestamp: Date;
}

