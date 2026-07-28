/**
 * Observabilidade do AI Gateway — logs estruturados e métricas in-memory.
 */

const metrics = {
  requests: 0,
  successes: 0,
  failures: 0,
  retries: 0,
  timeouts: 0,
  cacheHits: 0,
  cacheMisses: 0,
  totalTokens: 0,
  totalCostUsd: 0,
  byTask: {},
  byModel: {},
  recent: [],
};

const MAX_RECENT = 100;

function ensureBucket(map, key) {
  if (!map[key]) {
    map[key] = { count: 0, tokens: 0, costUsd: 0, avgLatencyMs: 0, _latencySum: 0 };
  }
  return map[key];
}

/**
 * @param {object} entry
 */
export function logAiEvent(entry) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    service: 'ai-gateway',
    ...entry,
  });
  if (entry.level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

/**
 * Registra métricas de uma chamada ao gateway.
 * @param {object} params
 */
export function recordMetrics(params) {
  const {
    task,
    model,
    consumer,
    success,
    latencyMs,
    promptTokens = 0,
    completionTokens = 0,
    costUsd = 0,
    cached = false,
    retries = 0,
    timedOut = false,
    error,
  } = params;

  metrics.requests += 1;
  if (success) metrics.successes += 1;
  else metrics.failures += 1;
  if (cached) metrics.cacheHits += 1;
  else metrics.cacheMisses += 1;
  metrics.retries += retries;
  if (timedOut) metrics.timeouts += 1;
  metrics.totalTokens += promptTokens + completionTokens;
  metrics.totalCostUsd += costUsd;

  for (const [map, key] of [[metrics.byTask, task], [metrics.byModel, model]]) {
    const bucket = ensureBucket(map, key);
    bucket.count += 1;
    bucket.tokens += promptTokens + completionTokens;
    bucket.costUsd += costUsd;
    bucket._latencySum += latencyMs;
    bucket.avgLatencyMs = Math.round(bucket._latencySum / bucket.count);
  }

  const recentEntry = {
    ts: new Date().toISOString(),
    task,
    model,
    consumer,
    success,
    latencyMs,
    tokens: promptTokens + completionTokens,
    costUsd: Math.round(costUsd * 1e6) / 1e6,
    cached,
    retries,
    error: error ? String(error).slice(0, 120) : undefined,
  };

  metrics.recent.unshift(recentEntry);
  if (metrics.recent.length > MAX_RECENT) metrics.recent.length = MAX_RECENT;

  logAiEvent({ level: success ? 'info' : 'error', event: 'ai_completion', ...recentEntry });
}

/** @returns {typeof metrics} snapshot */
export function getMetricsSnapshot() {
  const snapshot = JSON.parse(JSON.stringify(metrics));
  for (const map of [snapshot.byTask, snapshot.byModel]) {
    for (const key of Object.keys(map)) {
      delete map[key]._latencySum;
    }
  }
  return snapshot;
}

export function resetMetrics() {
  Object.assign(metrics, {
    requests: 0,
    successes: 0,
    failures: 0,
    retries: 0,
    timeouts: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalTokens: 0,
    totalCostUsd: 0,
    byTask: {},
    byModel: {},
    recent: [],
  });
}
