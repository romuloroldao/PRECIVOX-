/**
 * Seed v3 — catálogo isolado por mercado (volume / testes reais).
 *
 * Variáveis de ambiente:
 *   SEED_V3_MERCADOS=12
 *   SEED_V3_PRODUTOS_POR_MERCADO=5500
 *   SEED_V3_UNIDADES_POR_MERCADO=1
 */

export const SEED_V3_PREFIX = 'seed-v3';
export const SEED_V3_MARKER = 'precivox-catalogo-isolado-v3';

export const CONFIG = {
  mercados: Math.min(parseInt(process.env.SEED_V3_MERCADOS || '5', 10), 20),
  produtosPorMercado: Math.min(
    parseInt(process.env.SEED_V3_PRODUTOS_POR_MERCADO || '5500', 10),
    15000
  ),
  unidadesPorMercado: Math.max(parseInt(process.env.SEED_V3_UNIDADES_POR_MERCADO || '1', 10), 1),
  batchSize: 400,
  senhaGestor: 'senha123',
} as const;

export const NOMES_MERCADOS_V3 = [
  'Rede Isolada Alpha',
  'Rede Isolada Beta',
  'Rede Isolada Gamma',
  'Rede Isolada Delta',
  'Rede Isolada Epsilon',
  'Rede Isolada Zeta',
  'Rede Isolada Eta',
  'Rede Isolada Theta',
  'Rede Isolada Iota',
  'Rede Isolada Kappa',
  'Rede Isolada Lambda',
  'Rede Isolada Mu',
] as const;
