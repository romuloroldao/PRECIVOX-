export type IntegracaoTier = 1 | 2 | 3;

export type MarketingIntegracao = {
  id: string;
  nome: string;
  tier: IntegracaoTier;
  metodo: string;
  descricao: string;
  cadencia: string;
  requisitos: string[];
};

export const INTEGRACOES: MarketingIntegracao[] = [
  {
    id: 'upload-manual',
    nome: 'Upload Manual',
    tier: 1,
    metodo: 'CSV · XLSX · JSON',
    descricao: 'Importação via painel gestor com validação automática e truth layer.',
    cadencia: 'Semanal ou sob demanda',
    requisitos: ['Conta gestor', 'Contrato SLA Tier 1 aceito'],
  },
  {
    id: 'sync-url',
    nome: 'Sync por URL',
    tier: 2,
    metodo: 'URL pública do arquivo',
    descricao: 'Scheduler PRECIVOX busca o arquivo automaticamente no intervalo configurado.',
    cadencia: '6h · 12h · 24h · semanal',
    requisitos: ['Tier ≥ 2', 'URL estável do catálogo', 'Unidade de destino configurada'],
  },
  {
    id: 'sync-sftp',
    nome: 'Sync SFTP',
    tier: 2,
    metodo: 'SFTP seguro',
    descricao: 'Integração com servidor do parceiro para catálogos grandes.',
    cadencia: '6h · 12h · 24h · semanal',
    requisitos: ['Tier ≥ 2', 'Credenciais SFTP', 'Contrato SLA aceito'],
  },
  {
    id: 'api-batch',
    nome: 'API Batch',
    tier: 2,
    metodo: 'POST /api/partner/v1/estoques',
    descricao: 'Atualização programática de estoques via JSON com autenticação Bearer.',
    cadencia: 'Sob demanda (≤ 24h SLA Tier 2)',
    requisitos: ['Tier ≥ 2', 'PARTNER_API_KEYS configurada', 'mercadoId + unidadeId'],
  },
  {
    id: 'webhook-preco',
    nome: 'Webhook de Preço',
    tier: 3,
    metodo: 'POST /api/partner/v1/preco-alterado',
    descricao: 'Alterações incrementais de preço em tempo quase real (até 500/request).',
    cadencia: 'Tempo real',
    requisitos: ['Tier 3', 'Chave API', 'eventId para idempotência'],
  },
  {
    id: 'preci-network',
    nome: 'PRECI Network',
    tier: 3,
    metodo: 'GET /api/preci-network/v1/*',
    descricao: 'API de intenção agregada para CPG e parceiros enterprise (LGPD).',
    cadencia: 'Consulta sob demanda',
    requisitos: ['Plano Enterprise', 'PRECI_NETWORK_API_KEYS', 'Contrato LGPD CPG'],
  },
];

export const API_EXAMPLES = {
  batchEstoques: `POST /api/partner/v1/estoques
Authorization: Bearer <chave-do-mercado>
Content-Type: application/json

{
  "mercadoId": "uuid-do-mercado",
  "unidadeId": "uuid-da-unidade",
  "itens": [
    {
      "nome": "Arroz Branco 5kg",
      "preco": 24.9,
      "quantidade": 120,
      "codigo_barras": "7891234567890",
      "categoria": "Alimentos",
      "marca": "Camil",
      "preco_promocional": 21.9,
      "em_promocao": true
    }
  ]
}`,
  webhookPreco: `POST /api/partner/v1/preco-alterado
Authorization: Bearer <chave>
Content-Type: application/json

{
  "mercadoId": "uuid",
  "unidadeId": "uuid",
  "eventId": "idempotencia-opcional",
  "alteracoes": [
    {
      "codigoBarras": "7891234567890",
      "preco": 22.5,
      "precoPromocional": 19.9,
      "emPromocao": true,
      "quantidade": 80
    }
  ]
}`,
  preciNetwork: `GET /api/preci-network/v1/intent?mercadoId=<ID>&dias=14&regiaoModo=cep5
Authorization: Bearer <chave-cpg>`,
};

export const COLUNAS_CATALOGO = [
  { coluna: 'nome', obrigatorio: true, exemplo: 'Arroz Branco 5kg' },
  { coluna: 'preco', obrigatorio: true, exemplo: '24.90' },
  { coluna: 'quantidade', obrigatorio: false, exemplo: '120' },
  { coluna: 'codigo_barras', obrigatorio: false, exemplo: '7891234567890' },
  { coluna: 'categoria', obrigatorio: false, exemplo: 'Alimentos' },
  { coluna: 'marca', obrigatorio: false, exemplo: 'Camil' },
  { coluna: 'preco_promocional', obrigatorio: false, exemplo: '21.90' },
  { coluna: 'em_promocao', obrigatorio: false, exemplo: 'true' },
];
