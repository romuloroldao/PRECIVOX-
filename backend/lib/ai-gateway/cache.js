/**
 * Cache in-memory com TTL para respostas idênticas do gateway.
 */

import { GATEWAY_DEFAULTS } from './config.js';

/** @type {Map<string, { value: unknown; expiresAt: number }>} */
const cache = new Map();

/**
 * @param {string} key
 */
export function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * @param {string} key
 * @param {unknown} value
 * @param {number} [ttlMs]
 */
export function cacheSet(key, value, ttlMs = GATEWAY_DEFAULTS.cacheTtlMs) {
  if (cache.size >= GATEWAY_DEFAULTS.cacheMaxEntries) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheStats() {
  let active = 0;
  const now = Date.now();
  for (const entry of cache.values()) {
    if (entry.expiresAt > now) active += 1;
  }
  return { size: cache.size, active, maxEntries: GATEWAY_DEFAULTS.cacheMaxEntries };
}

export function cacheClear() {
  cache.clear();
}

/**
 * @param {string} task
 * @param {string} promptVersion
 * @param {unknown} inputFingerprint
 */
export function buildCacheKey(task, promptVersion, inputFingerprint) {
  return `${task}:${promptVersion}:${inputFingerprint}`;
}
