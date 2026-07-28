/**
 * Configuração central do AI Gateway.
 * Nenhum outro módulo deve ler GROQ_* diretamente — apenas via gateway.
 */

export const GATEWAY_VERSION = '1.0.0';

/** Perfis de modelo — multi-modelo por caso de uso */
export const MODEL_PROFILES = {
  reasoning: process.env.GROQ_MODEL_REASONING || 'openai/gpt-oss-120b',
  fast: process.env.GROQ_MODEL_FAST || 'openai/gpt-oss-20b',
};

/** Mapeamento tarefa → perfil de modelo */
export const TASK_MODEL_MAP = {
  'shopping-list-analysis': 'reasoning',
  'price-analysis': 'reasoning',
  'product-alternatives': 'fast',
  'route-optimization': 'fast',
};

/** Custo estimado USD por 1M tokens (Groq, jul/2026) — para observabilidade */
export const MODEL_PRICING = {
  'openai/gpt-oss-120b': { input: 0.15, output: 0.6, cachedInput: 0.075 },
  'openai/gpt-oss-20b': { input: 0.075, output: 0.3, cachedInput: 0.0375 },
};

export const GATEWAY_DEFAULTS = {
  timeoutMs: Number(process.env.AI_GATEWAY_TIMEOUT_MS) || 30_000,
  maxRetries: Number(process.env.AI_GATEWAY_MAX_RETRIES) || 2,
  retryDelayMs: Number(process.env.AI_GATEWAY_RETRY_DELAY_MS) || 500,
  cacheTtlMs: Number(process.env.AI_GATEWAY_CACHE_TTL_MS) || 5 * 60 * 1000,
  cacheMaxEntries: Number(process.env.AI_GATEWAY_CACHE_MAX) || 200,
};
