/**
 * AI Gateway — ponto único de entrada para provedores de IA.
 *
 * Responsabilidades:
 * - Seleção de modelo por tarefa
 * - Prompt management (versionado)
 * - Sanitização anti-injection
 * - Validação de resposta (JSON schema leve)
 * - Timeout, retry, fallback
 * - Cache e observabilidade
 */

import crypto from 'crypto';
import { GATEWAY_VERSION, GATEWAY_DEFAULTS, MODEL_PRICING, TASK_MODEL_MAP } from './config.js';
import { buildPrompt } from './prompts/index.js';
import { parseAndValidate } from './schemas.js';
import { groqComplete, resolveModel, isProviderConfigured, getConfiguredModels } from './providers/groq.js';
import { cacheGet, cacheSet, buildCacheKey, cacheStats, cacheClear } from './cache.js';
import { recordMetrics, getMetricsSnapshot, resetMetrics } from './observability.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function estimateCost(model, promptTokens, completionTokens) {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  return (promptTokens * pricing.input + completionTokens * pricing.output) / 1_000_000;
}

function fingerprintInput(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 16);
}

function isRetryableError(err) {
  const code = err?.code || err?.status;
  return (
    code === 'TIMEOUT' ||
    code === 429 ||
    code === 500 ||
    code === 502 ||
    code === 503 ||
    (typeof err?.message === 'string' && err.message.includes('rate'))
  );
}

class AiGateway {
  /**
   * Executa uma tarefa de IA com roteamento, retry e observabilidade.
   *
   * @param {object} options
   * @param {string} options.task - ID da tarefa (shopping-list-analysis, etc.)
   * @param {Record<string, unknown>} options.input - Dados para o prompt builder
   * @param {string} [options.consumer] - Endpoint ou componente consumidor
   * @param {boolean} [options.useCache=true]
   * @param {() => Promise<unknown> | unknown} [options.fallback] - Retorno quando provider indisponível
   */
  async complete({ task, input, consumer = 'unknown', useCache = true, fallback = null }) {
    const startTime = Date.now();
    let retries = 0;
    let cached = false;

    const promptDef = buildPrompt(task, input);
    const model = resolveModel(promptDef.profile || TASK_MODEL_MAP[task] || 'reasoning');
    const cacheKey = buildCacheKey(task, promptDef.version, fingerprintInput(input));

    if (useCache) {
      const hit = cacheGet(cacheKey);
      if (hit) {
        cached = true;
        recordMetrics({
          task,
          model,
          consumer,
          success: true,
          latencyMs: Date.now() - startTime,
          cached: true,
          retries: 0,
        });
        return { ...hit, _meta: { ...hit._meta, cached: true } };
      }
    }

    if (!isProviderConfigured()) {
      if (fallback) {
        const fb = await fallback();
        recordMetrics({
          task,
          model: 'fallback',
          consumer,
          success: true,
          latencyMs: Date.now() - startTime,
          cached: false,
          retries: 0,
        });
        return { data: fb, _meta: { provider: 'fallback', cached: false } };
      }
      const err = new Error('Provedor de IA indisponível');
      err.code = 'PROVIDER_UNAVAILABLE';
      throw err;
    }

    let lastError = null;

    for (let attempt = 0; attempt <= GATEWAY_DEFAULTS.maxRetries; attempt++) {
      if (attempt > 0) {
        retries += 1;
        await sleep(GATEWAY_DEFAULTS.retryDelayMs * attempt);
      }

      try {
        const result = await groqComplete({
          model,
          messages: promptDef.messages,
          temperature: promptDef.temperature,
          maxTokens: promptDef.maxTokens,
          timeoutMs: GATEWAY_DEFAULTS.timeoutMs,
        });

        const parsed = parseAndValidate(result.content, task);
        if (!parsed.ok) {
          const validationErr = new Error(`Validação falhou: ${parsed.errors.join(', ')}`);
          validationErr.code = 'VALIDATION_ERROR';
          throw validationErr;
        }

        const costUsd = estimateCost(result.model, result.usage.promptTokens, result.usage.completionTokens);
        const latencyMs = Date.now() - startTime;

        const response = {
          data: parsed.data,
          _meta: {
            task,
            promptVersion: promptDef.version,
            model: result.model,
            consumer,
            latencyMs,
            tokens: result.usage,
            costUsd,
            cached: false,
            retries,
          },
        };

        if (useCache) cacheSet(cacheKey, response);

        recordMetrics({
          task,
          model: result.model,
          consumer,
          success: true,
          latencyMs,
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          costUsd,
          cached: false,
          retries,
        });

        return response;
      } catch (err) {
        lastError = err;
        if (!isRetryableError(err) || attempt >= GATEWAY_DEFAULTS.maxRetries) break;
      }
    }

    const latencyMs = Date.now() - startTime;
    const timedOut = lastError?.code === 'TIMEOUT';

    recordMetrics({
      task,
      model,
      consumer,
      success: false,
      latencyMs,
      cached: false,
      retries,
      timedOut,
      error: lastError?.message,
    });

    if (fallback) {
      const fb = await fallback();
      return { data: fb, _meta: { provider: 'fallback', error: lastError?.message, retries } };
    }

    throw lastError;
  }

  health() {
    return {
      status: 'ok',
      gatewayVersion: GATEWAY_VERSION,
      providerConfigured: isProviderConfigured(),
      models: getConfiguredModels(),
      prompts: Object.keys(TASK_MODEL_MAP),
      cache: cacheStats(),
    };
  }

  metrics() {
    return getMetricsSnapshot();
  }

  clearCache() {
    cacheClear();
  }
}

/** @type {AiGateway | null} */
let instance = null;

export function getAiGateway() {
  if (!instance) instance = new AiGateway();
  return instance;
}

export { GATEWAY_VERSION, resetMetrics };
