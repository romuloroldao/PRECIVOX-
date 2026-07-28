/**
 * AI Gateway — exportações públicas.
 * Único ponto de importação para o restante da aplicação.
 */

export { getAiGateway, GATEWAY_VERSION, resetMetrics } from './gateway.js';
export { sanitizeUserText, sanitizeProduct, sanitizeListItems } from './sanitize.js';
export { listPrompts } from './prompts/index.js';
export { isProviderConfigured, getConfiguredModels } from './providers/groq.js';
