/**
 * Configuração do seed analítico Precivox.
 * Ajuste volumes aqui para testes de carga.
 */
export const SEED_PREFIX = 'seed-v2';
export const SEED_MARKER = 'precivox-analytics-seed-v2';

export const CONFIG = {
  /** Total de tenants (mercados B2B) */
  totalMercados: 12,
  /** Mercados com dados operacionais completos */
  mercadosFlagship: 3,
  /** Produtos por unidade dos mercados flagship */
  produtosPorUnidadeFlagship: 5000,
  /** Produtos por unidade dos mercados leves */
  produtosPorUnidadeLeve: 200,
  /** Gestores a criar */
  gestores: 4,
  /** Consumidores (User CLIENTE) para dados comportamentais */
  consumidores: 20,
  /** Dias de histórico de vendas */
  diasHistoricoVendas: 180,
  /** Vendas por dia por unidade (flagship) */
  vendasPorDia: { min: 80, max: 350 },
  /** Tamanho do lote para inserts em massa */
  batchSize: 500,
  /** Senha padrão dos usuários seed */
  senhaPadrao: 'senha123',
  /** Taxa de abandono de carrinho simulada (0-1) */
  taxaAbandonoCarrinho: 0.12,
  /** Produtos relacionados por produto top */
  maxProdutosRelacionados: 5,
  /** Métricas dashboard: dias retroativos */
  diasMetricasDashboard: 90,
} as const;

export type PerfilMercado = 'premium' | 'atacarejo' | 'bairro' | 'conveniencia';

export interface MercadoTemplate {
  nome: string;
  segmento: string;
  perfil: PerfilMercado;
  unidades: number;
  flagship: boolean;
  ticketMedio: { min: number; max: number };
  volumeVendas: 'alto' | 'medio' | 'baixo';
  publicoAlvo: string;
  sazonalidade: number;
}

export const MERCADOS_TEMPLATES: MercadoTemplate[] = [
  {
    nome: 'Empório Select Premium',
    segmento: 'Supermercado Premium',
    perfil: 'premium',
    unidades: 2,
    flagship: true,
    ticketMedio: { min: 85, max: 220 },
    volumeVendas: 'medio',
    publicoAlvo: 'Classe A/B — bairros nobres',
    sazonalidade: 0.35,
  },
  {
    nome: 'Atacadão Econômico Brasil',
    segmento: 'Atacarejo',
    perfil: 'atacarejo',
    unidades: 2,
    flagship: true,
    ticketMedio: { min: 120, max: 450 },
    volumeVendas: 'alto',
    publicoAlvo: 'Famílias e revendedores',
    sazonalidade: 0.55,
  },
  {
    nome: 'Mercadinho do Bairro',
    segmento: 'Varejo de Proximidade',
    perfil: 'bairro',
    unidades: 1,
    flagship: true,
    ticketMedio: { min: 25, max: 75 },
    volumeVendas: 'medio',
    publicoAlvo: 'Moradores locais — compra diária',
    sazonalidade: 0.25,
  },
  {
    nome: 'QuickMart Express',
    segmento: 'Conveniência',
    perfil: 'conveniencia',
    unidades: 1,
    flagship: false,
    ticketMedio: { min: 15, max: 45 },
    volumeVendas: 'baixo',
    publicoAlvo: 'Compras rápidas 24h',
    sazonalidade: 0.15,
  },
  {
    nome: 'Rede Nova Era Supermercados',
    segmento: 'Supermercado Regional',
    perfil: 'bairro',
    unidades: 1,
    flagship: false,
    ticketMedio: { min: 40, max: 95 },
    volumeVendas: 'medio',
    publicoAlvo: 'Classe B/C',
    sazonalidade: 0.4,
  },
  {
    nome: 'Fresh Market Orgânico',
    segmento: 'Alimentação Saudável',
    perfil: 'premium',
    unidades: 1,
    flagship: false,
    ticketMedio: { min: 60, max: 150 },
    volumeVendas: 'baixo',
    publicoAlvo: 'Consumidores health-conscious',
    sazonalidade: 0.3,
  },
  {
    nome: 'SuperMax Atacado',
    segmento: 'Atacarejo',
    perfil: 'atacarejo',
    unidades: 1,
    flagship: false,
    ticketMedio: { min: 100, max: 380 },
    volumeVendas: 'alto',
    publicoAlvo: 'PMEs e consumidor final',
    sazonalidade: 0.5,
  },
  {
    nome: 'Vila Verde Hortifruti',
    segmento: 'Hortifruti Especializado',
    perfil: 'bairro',
    unidades: 1,
    flagship: false,
    ticketMedio: { min: 30, max: 80 },
    volumeVendas: 'medio',
    publicoAlvo: 'Produtos frescos',
    sazonalidade: 0.65,
  },
  {
    nome: 'Stop & Go Conveniência',
    segmento: 'Conveniência',
    perfil: 'conveniencia',
    unidades: 1,
    flagship: false,
    ticketMedio: { min: 12, max: 40 },
    volumeVendas: 'baixo',
    publicoAlvo: 'Postos e rodovias',
    sazonalidade: 0.2,
  },
  {
    nome: 'Casa & Lar Supermercados',
    segmento: 'Supermercado Familiar',
    perfil: 'bairro',
    unidades: 1,
    flagship: false,
    ticketMedio: { min: 45, max: 110 },
    volumeVendas: 'medio',
    publicoAlvo: 'Famílias de bairro',
    sazonalidade: 0.35,
  },
  {
    nome: 'Gourmet & Cia',
    segmento: 'Gourmet',
    perfil: 'premium',
    unidades: 1,
    flagship: false,
    ticketMedio: { min: 70, max: 200 },
    volumeVendas: 'baixo',
    publicoAlvo: 'Gastronomia e eventos',
    sazonalidade: 0.45,
  },
  {
    nome: 'Popular Preços Baixos',
    segmento: 'Desconto',
    perfil: 'atacarejo',
    unidades: 1,
    flagship: false,
    ticketMedio: { min: 55, max: 160 },
    volumeVendas: 'alto',
    publicoAlvo: 'Classe C/D — preço sensível',
    sazonalidade: 0.5,
  },
];

export const CIDADES_BR = [
  { cidade: 'São Paulo', estado: 'SP', lat: -23.5505, lng: -46.6333, bairros: ['Pinheiros', 'Moema', 'Tatuapé', 'Santana', 'Ipiranga'] },
  { cidade: 'Rio de Janeiro', estado: 'RJ', lat: -22.9068, lng: -43.1729, bairros: ['Copacabana', 'Tijuca', 'Barra da Tijuca', 'Botafogo'] },
  { cidade: 'Belo Horizonte', estado: 'MG', lat: -19.9167, lng: -43.9345, bairros: ['Savassi', 'Pampulha', 'Centro', 'Barreiro'] },
  { cidade: 'Curitiba', estado: 'PR', lat: -25.4284, lng: -49.2733, bairros: ['Batel', 'Centro', 'Portão', 'Boqueirão'] },
  { cidade: 'Porto Alegre', estado: 'RS', lat: -30.0346, lng: -51.2177, bairros: ['Moinhos', 'Centro', 'Cidade Baixa'] },
  { cidade: 'Salvador', estado: 'BA', lat: -12.9714, lng: -38.5014, bairros: ['Pituba', 'Barra', 'Centro'] },
  { cidade: 'Recife', estado: 'PE', lat: -8.0476, lng: -34.877, bairros: ['Boa Viagem', 'Centro', 'Graças'] },
  { cidade: 'Fortaleza', estado: 'CE', lat: -3.7172, lng: -38.5433, bairros: ['Meireles', 'Aldeota', 'Centro'] },
  { cidade: 'Brasília', estado: 'DF', lat: -15.7942, lng: -47.8822, bairros: ['Asa Sul', 'Asa Norte', 'Taguatinga'] },
  { cidade: 'Campinas', estado: 'SP', lat: -22.9099, lng: -47.0626, bairros: ['Cambuí', 'Centro', 'Taquaral'] },
  { cidade: 'Goiânia', estado: 'GO', lat: -16.6869, lng: -49.2648, bairros: ['Setor Bueno', 'Centro', 'Marista'] },
  { cidade: 'Florianópolis', estado: 'SC', lat: -27.5954, lng: -48.548, bairros: ['Centro', 'Trindade', 'Coqueiros'] },
];
