export type MarketingCase = {
  id: string;
  mercado: string;
  tipo: 'rede' | 'atacarejo' | 'atacado';
  plano: string;
  regiao: string;
  desafio: string;
  solucao: string;
  resultados: string[];
  modulos: string[];
  destaque?: boolean;
};

export const MARKETING_CASES: MarketingCase[] = [
  {
    id: 'emporio-select',
    mercado: 'Empório Select Premium',
    tipo: 'rede',
    plano: 'Enterprise',
    regiao: 'Região piloto CEP5',
    desafio:
      'Mercado premium precisava entender demanda do bairro antes de ajustar preço e promoção — sem depender só de planilha.',
    solucao:
      'Implementação como parceiro âncora #1 com radar de demanda, GROOC semanal e pricing assistido integrado ao catálogo.',
    resultados: [
      'Parceiro âncora de referência na região piloto',
      '7 módulos SaaS ativos no plano Enterprise',
      'Insights CPG habilitados para parcerias com indústria',
    ],
    modulos: ['Radar de demanda', 'GROOC', 'Pricing assistido', 'CPG Insights', 'Saúde do catálogo'],
    destaque: true,
  },
  {
    id: 'atacadao-economico',
    mercado: 'Atacadão Econômico Brasil',
    tipo: 'atacarejo',
    plano: 'Pro',
    regiao: 'Região piloto CEP5',
    desafio:
      'Alto volume de SKUs com promoções frequentes — difícil saber quais categorias tinham demanda crescente no bairro.',
    solucao:
      'Plano Pro com heatmap de intenção, benchmark regional e promo direcionada por segmento comportamental.',
    resultados: [
      'Visibilidade de demanda por categoria em 7/14/30 dias',
      'Promo segmentada por Intent Score',
      'Benchmark vs concorrência regional',
    ],
    modulos: ['Heatmap de intenção', 'Benchmark regional', 'Promo direcionada', 'ML leve'],
  },
  {
    id: 'supermax-atacado',
    mercado: 'SuperMax Atacado',
    tipo: 'atacarejo',
    plano: 'Pro',
    regiao: 'Região piloto CEP5',
    desafio:
      'Operação atacadista com múltiplas unidades — necessidade de sincronizar catálogo e manter preços competitivos.',
    solucao:
      'Sync agendado via URL + pricing assistido com aprovação em 1 toque para ajustes de margem.',
    resultados: [
      'Catálogo sincronizado automaticamente',
      'Alertas de ruptura preditiva ativos',
      'Selo parceiro âncora na busca do consumidor',
    ],
    modulos: ['Sync agendado', 'Pricing assistido', 'Ruptura preditiva', 'Oferta agregada'],
  },
  {
    id: 'mercadinho-bairro',
    mercado: 'Mercadinho do Bairro',
    tipo: 'rede',
    plano: 'Pro',
    regiao: 'Região piloto CEP5',
    desafio:
      'Varejo de bairro competindo com redes maiores — precisava de inteligência acessível sem equipe de BI.',
    solucao:
      'Entrada no plano Pro com radar de demanda e resumo semanal GROOC em linguagem simples.',
    resultados: [
      'Decisões semanais baseadas em dados do bairro',
      'Integração via upload CSV em menos de 24h',
      'Badge âncora visível para consumidores da região',
    ],
    modulos: ['Radar de demanda', 'GROOC', 'Upload smart', 'Saúde do catálogo'],
  },
  {
    id: 'popular-precos',
    mercado: 'Popular Preços Baixos',
    tipo: 'atacarejo',
    plano: 'Essencial',
    regiao: 'Região piloto CEP5',
    desafio:
      'Foco em preço baixo exige ajustes frequentes — sem ferramenta para saber se estava competitivo na região.',
    solucao:
      'Plano Essencial com radar de demanda e pricing assistido como ponto de entrada.',
    resultados: [
      'Primeiro mercado no tier Essencial do piloto',
      'Visão de termos mais buscados no CEP',
      'Caminho de upgrade para Pro documentado',
    ],
    modulos: ['Radar de demanda', 'Pricing assistido'],
  },
];

export const PILOTO_STATS = {
  ancoraCount: 5,
  mercadosAtivos: 27,
  regiao: 'CEP5 — região piloto',
  gestorReferencia: 'Empório Select Premium',
};
