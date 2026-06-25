export type FuncionalidadeCategoria =
  | 'inteligencia_artificial'
  | 'automacao'
  | 'comunicacao'
  | 'gestao'
  | 'relatorios'
  | 'integracoes'
  | 'seguranca'
  | 'performance'
  | 'analytics'
  | 'gamificacao';

export type FuncionalidadeAudiencia = 'b2c' | 'b2b' | 'ambos';

export type MarketingFuncionalidade = {
  id: string;
  nome: string;
  categoria: FuncionalidadeCategoria;
  audiencia: FuncionalidadeAudiencia;
  descricao: string;
  beneficio: string;
  valorCliente: string;
  diferencial: string;
  destaque?: boolean;
};

export const CATEGORIA_LABELS: Record<FuncionalidadeCategoria, string> = {
  inteligencia_artificial: 'Inteligência Artificial',
  automacao: 'Automação',
  comunicacao: 'Comunicação',
  gestao: 'Gestão',
  relatorios: 'Relatórios',
  integracoes: 'Integrações',
  seguranca: 'Segurança',
  performance: 'Performance',
  analytics: 'Analytics',
  gamificacao: 'Gamificação & Retenção',
};

export const FUNCIONALIDADES: MarketingFuncionalidade[] = [
  {
    id: 'economia-liquida',
    nome: 'Economia Líquida™',
    categoria: 'inteligencia_artificial',
    audiencia: 'b2c',
    descricao: 'Calcula economia real considerando deslocamento, tempo e valor do seu tempo.',
    beneficio: 'Evita “economia falsa” indo longe para poupar centavos.',
    valorCliente: 'Decisão de compra com ROI real, não só preço de vitrine.',
    diferencial: 'Métrica proprietária PRECIVOX — única no mercado brasileiro.',
    destaque: true,
  },
  {
    id: 'perfil-preci',
    nome: 'Perfil PRECI',
    categoria: 'inteligencia_artificial',
    audiencia: 'b2c',
    descricao: 'Perfil comportamental em 5 eixos para personalizar recomendações.',
    beneficio: 'Sugestões alinhadas ao seu hábito real de compra.',
    valorCliente: 'Menos tempo montando lista; mais assertividade.',
    diferencial: 'IA explicável — você entende por que cada sugestão aparece.',
  },
  {
    id: 'intent-score',
    nome: 'Intent Score',
    categoria: 'inteligencia_artificial',
    audiencia: 'ambos',
    descricao: 'Score de intenção de compra nas próximas 48–72 horas.',
    beneficio: 'Antecipa quando o consumidor vai ao mercado.',
    valorCliente: 'B2C: alertas no momento certo. B2B: segmentação de promo.',
    diferencial: 'Sinal proprietário do grafo PRECI, não tráfego genérico.',
    destaque: true,
  },
  {
    id: 'grooc',
    nome: 'GROOC — Assistente IA',
    categoria: 'inteligencia_artificial',
    audiencia: 'b2b',
    descricao: 'Assistente para gestores com respostas sempre citando fontes de dados.',
    beneficio: 'Decisões rápidas em linguagem de negócio.',
    valorCliente: 'Resumo semanal acionável sem analisar planilhas.',
    diferencial: 'IA explicável com fontes — não caixa preta.',
    destaque: true,
  },
  {
    id: 'pricing-assistido',
    nome: 'Pricing Assistido',
    categoria: 'inteligencia_artificial',
    audiencia: 'b2b',
    descricao: 'Sugestões de preço com benchmark regional e aprovação em 1 toque.',
    beneficio: 'Ajuste de margem sem planilha ou feeling.',
    valorCliente: 'Competitividade cirúrgica sem promo destrutiva.',
    diferencial: 'Cruza catálogo + demanda do bairro em tempo quase real.',
    destaque: true,
  },
  {
    id: 'ml-leve',
    nome: 'ML Leve',
    categoria: 'inteligencia_artificial',
    audiencia: 'b2b',
    descricao: 'Basket completion, churn e elasticidade por segmento.',
    beneficio: 'Antecipa abandono e oportunidades de cesta.',
    valorCliente: 'Promo e estoque alinhados ao comportamento real.',
    diferencial: 'Modelos leves, batch — baixo custo, alta frequência.',
  },
  {
    id: 'scan-inteligente',
    nome: 'Scan Inteligente',
    categoria: 'inteligencia_artificial',
    audiencia: 'b2c',
    descricao: 'OCR + embedding para identificar produtos na gôndola ou em casa.',
    beneficio: 'Adiciona itens à lista sem digitar.',
    valorCliente: 'Experiência in-store conectada ao comparador.',
    diferencial: 'Integrado à Economia Líquida™ e truth layer.',
  },
  {
    id: 'troca-inteligente',
    nome: 'Troca Inteligente',
    categoria: 'inteligencia_artificial',
    audiencia: 'b2c',
    descricao: 'Sugestões de substituição de produtos com explicação clara.',
    beneficio: 'Mantém a cesta dentro do orçamento sem perder qualidade.',
    valorCliente: 'Flexibilidade com transparência.',
    diferencial: 'Substituições explicáveis, não aleatórias.',
  },
  {
    id: 'sync-agendado',
    nome: 'Sync Agendado',
    categoria: 'automacao',
    audiencia: 'b2b',
    descricao: 'Atualização automática de catálogo via URL ou SFTP (6h a semanal).',
    beneficio: 'Catálogo sempre fresco sem trabalho manual.',
    valorCliente: 'Confiança do consumidor preservada.',
    diferencial: 'Job a cada 30 min no scheduler PRECIVOX.',
  },
  {
    id: 'upload-smart',
    nome: 'Upload Smart',
    categoria: 'automacao',
    audiencia: 'b2b',
    descricao: 'Importação CSV, XLSX ou JSON com validação e deduplicação.',
    beneficio: 'Primeira carga em minutos, não dias.',
    valorCliente: 'Onboarding rápido para novos parceiros.',
    diferencial: 'Truth layer aplicado automaticamente na importação.',
  },
  {
    id: 'webhook-preco',
    nome: 'Webhook de Preço',
    categoria: 'automacao',
    audiencia: 'b2b',
    descricao: 'Notificação incremental de alterações de preço (Tier 3).',
    beneficio: 'Preços atualizados em tempo quase real.',
    valorCliente: 'Selo “preço verificado” e maior conversão.',
    diferencial: 'Até 500 alterações por request com idempotência.',
  },
  {
    id: 'push-retencao',
    nome: 'Push de Retenção',
    categoria: 'comunicacao',
    audiencia: 'b2c',
    descricao: 'Alertas de cesta provável, dia de mercado e ofertas relevantes.',
    beneficio: 'Lembra o consumidor no momento certo.',
    valorCliente: 'Hábito semanal e maior frequência de uso.',
    diferencial: 'Baseado em Intent Score, não broadcast genérico.',
  },
  {
    id: 'promo-direcionada',
    nome: 'Promo Direcionada',
    categoria: 'comunicacao',
    audiencia: 'b2b',
    descricao: 'Promoções por segmento: intent alta, churn, cesta da semana.',
    beneficio: 'Promo que converte, não que queima margem.',
    valorCliente: 'ROI mensurável por campanha.',
    diferencial: 'Segmentação comportamental proprietária.',
    destaque: true,
  },
  {
    id: 'alertas-preco',
    nome: 'Alertas de Preço',
    categoria: 'comunicacao',
    audiencia: 'b2c',
    descricao: 'Notificações quando produtos acompanhados mudam de preço.',
    beneficio: 'Nunca perde uma oferta relevante.',
    valorCliente: 'Economia passiva sem consultar manualmente.',
    diferencial: 'Integrado ao truth layer e crowd verification.',
  },
  {
    id: 'radar-demanda',
    nome: 'Radar de Demanda',
    categoria: 'gestao',
    audiencia: 'b2b',
    descricao: 'Termos e produtos mais buscados no bairro (7/14/30 dias).',
    beneficio: 'Antecipa demanda antes do concorrente.',
    valorCliente: 'Estoque e promo alinhados à intenção real.',
    diferencial: 'Dado proprietário do grafo PRECI.',
    destaque: true,
  },
  {
    id: 'saude-catalogo',
    nome: 'Saúde do Catálogo',
    categoria: 'gestao',
    audiencia: 'b2b',
    descricao: 'Score de freshness, cobertura e conformidade SLA.',
    beneficio: 'Visibilidade imediata de catálogo desatualizado.',
    valorCliente: 'Menos perda de confiança e conversão.',
    diferencial: 'Integrado a tiers de parceiro e selo verificado.',
  },
  {
    id: 'ruptura-preditiva',
    nome: 'Ruptura Preditiva',
    categoria: 'gestao',
    audiencia: 'b2b',
    descricao: 'Alerta antes da ruptura com base em demanda e estoque.',
    beneficio: 'Menos venda perdida por falta de produto.',
    valorCliente: 'Receita recuperada e cliente retido.',
    diferencial: 'Cruza sinais de intenção + estoque em tempo quase real.',
  },
  {
    id: 'oferta-agregada',
    nome: 'Oferta Agregada',
    categoria: 'gestao',
    audiencia: 'b2b',
    descricao: 'Mercado pode aceitar cestas agregadas da região.',
    beneficio: 'Captura demanda consolidada do bairro.',
    valorCliente: 'Ticket médio maior com operação eficiente.',
    diferencial: 'Único a conectar demanda agregada ao varejo local.',
  },
  {
    id: 'heatmap-intencao',
    nome: 'Heatmap de Intenção',
    categoria: 'relatorios',
    audiencia: 'b2b',
    descricao: 'Mapa geográfico de demanda por CEP ou polígono.',
    beneficio: 'Ações hiperlocais por micro-região.',
    valorCliente: 'Marketing e entrega com ROI mensurável.',
    diferencial: 'PRECI Graph hiperlocal.',
    destaque: true,
  },
  {
    id: 'benchmark-regional',
    nome: 'Benchmark Regional',
    categoria: 'relatorios',
    audiencia: 'b2b',
    descricao: 'Posição do seu preço vs concorrência da região.',
    beneficio: 'Saiba onde está caro ou barato demais.',
    valorCliente: 'Proteção de margem e market share.',
    diferencial: 'Truth layer + verificação crowd.',
  },
  {
    id: 'preci-index',
    nome: 'PRECI Index',
    categoria: 'relatorios',
    audiencia: 'ambos',
    descricao: 'Índice de cesta do bairro e inflação personalizada.',
    beneficio: 'Contexto macro e micro para decisão.',
    valorCliente: 'Transparência e autoridade na região.',
    diferencial: 'Índice hiperlocal, não IPCA genérico.',
  },
  {
    id: 'cpg-insights',
    nome: 'Insights CPG',
    categoria: 'relatorios',
    audiencia: 'b2b',
    descricao: 'Tendências agregadas por categoria e marca (k≥5, LGPD).',
    beneficio: 'Inteligência de categoria regional para indústria.',
    valorCliente: 'Nova linha de receita Enterprise.',
    diferencial: 'PRECI Network com anonimização rigorosa.',
  },
  {
    id: 'api-batch',
    nome: 'API Batch de Estoques',
    categoria: 'integracoes',
    audiencia: 'b2b',
    descricao: 'POST /api/partner/v1/estoques para atualização programática.',
    beneficio: 'Integração sem fricção com ERP/PDV.',
    valorCliente: 'Catálogo sempre sincronizado automaticamente.',
    diferencial: 'Tier 2+ com truth layer fonte=API_PARCEIRO.',
    destaque: true,
  },
  {
    id: 'preci-network',
    nome: 'PRECI Network API',
    categoria: 'integracoes',
    audiencia: 'b2b',
    descricao: 'API de intenção agregada para CPG e parceiros externos.',
    beneficio: 'Inteligência de mercado sem expor dados individuais.',
    valorCliente: 'Monetização Enterprise e ecossistema.',
    diferencial: 'LGPD by design com k-anonymity ≥5.',
  },
  {
    id: 'truth-layer',
    nome: 'Truth Layer',
    categoria: 'seguranca',
    audiencia: 'ambos',
    descricao: 'Metadados de confiança: fonte, timestamp, nível de verificação.',
    beneficio: 'Confiança verificável em cada preço exibido.',
    valorCliente: 'Maior conversão lista→visita.',
    diferencial: 'Selo “Preço verificado” + crowd sourcing.',
    destaque: true,
  },
  {
    id: 'lgpd',
    nome: 'Conformidade LGPD',
    categoria: 'seguranca',
    audiencia: 'ambos',
    descricao: 'DPO dedicado, dados no Brasil, portabilidade e exclusão.',
    beneficio: 'Compliance enterprise desde o dia 1.',
    valorCliente: 'Segurança jurídica para contratos B2B.',
    diferencial: 'Agregados B2B com k≥5 — privacidade por design.',
  },
  {
    id: 'modo-mercado-vivo',
    nome: 'Modo Mercado Ao Vivo',
    categoria: 'performance',
    audiencia: 'b2c',
    descricao: 'Experiência in-store com geofence e scan na gôndola.',
    beneficio: 'Compra informada dentro do mercado.',
    valorCliente: 'Engajamento e dados de contexto in-store.',
    diferencial: 'Geofence + EL integrados.',
  },
  {
    id: 'rota-multi-mercado',
    nome: 'Rota Multi-Mercado',
    categoria: 'performance',
    audiencia: 'b2c',
    descricao: 'Otimização de rota para comprar em vários mercados.',
    beneficio: 'Máxima economia com mínimo deslocamento.',
    valorCliente: 'Planejamento inteligente da semana.',
    diferencial: 'Geo NN + preferência parceiros âncora.',
  },
  {
    id: 'despensa-digital',
    nome: 'Despensa Digital',
    categoria: 'performance',
    audiencia: 'b2c',
    descricao: 'Estoque doméstico inferido a partir de hábitos de compra.',
    beneficio: 'Lista automática do que está acabando.',
    valorCliente: 'Menos esquecimentos e compras de emergência.',
    diferencial: 'Inferência comportamental, não cadastro manual.',
  },
  {
    id: 'crowd-precos',
    nome: 'Crowd / Waze de Preços',
    categoria: 'gamificacao',
    audiencia: 'b2c',
    descricao: 'Confirmação comunitária de preços em 3 toques.',
    beneficio: 'Dados mais frescos e confiáveis para todos.',
    valorCliente: 'Rede que melhora com o uso.',
    diferencial: 'Feedback loop que alimenta truth layer.',
  },
  {
    id: 'streak-economia',
    nome: 'Streak de Economia',
    categoria: 'gamificacao',
    audiencia: 'b2c',
    descricao: 'Hábito de uso com sequência de economia semanal.',
    beneficio: 'Retenção e engajamento contínuo.',
    valorCliente: 'Usuário volta toda semana antes do mercado.',
    diferencial: 'Gamificação ligada a valor real (R$), não pontos vazios.',
  },
];

export function funcionalidadesPorCategoria(
  filtro?: FuncionalidadeAudiencia
): Record<FuncionalidadeCategoria, MarketingFuncionalidade[]> {
  const grouped = {} as Record<FuncionalidadeCategoria, MarketingFuncionalidade[]>;

  for (const cat of Object.keys(CATEGORIA_LABELS) as FuncionalidadeCategoria[]) {
    grouped[cat] = [];
  }

  for (const f of FUNCIONALIDADES) {
    if (filtro && f.audiencia !== filtro && f.audiencia !== 'ambos') continue;
    grouped[f.categoria].push(f);
  }

  for (const cat of Object.keys(grouped) as FuncionalidadeCategoria[]) {
    if (grouped[cat].length === 0) delete grouped[cat];
  }

  return grouped;
}

export const DESTAQUES = FUNCIONALIDADES.filter((f) => f.destaque);
