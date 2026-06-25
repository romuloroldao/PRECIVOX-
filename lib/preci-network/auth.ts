/**
 * Autenticação PRECI Network — chaves externas (CPG, parceiros)
 *
 * PRECI_NETWORK_API_KEYS='{"cpg-demo":{"key":"secret","scopes":["intent","categories"],"label":"Demo CPG"}}'
 */

import { extrairBearerToken } from '@/lib/partner-api-auth';
import type { PreciNetworkClientConfig, PreciNetworkScope } from './types';

export type PreciNetworkAuthResult =
  | { ok: true; clientId: string; config: PreciNetworkClientConfig }
  | { ok: false; status: number; error: string };

function parseNetworkKeys(): Record<string, PreciNetworkClientConfig> {
  const raw = process.env.PRECI_NETWORK_API_KEYS;
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, PreciNetworkClientConfig | string>;
    if (typeof parsed !== 'object' || parsed === null) return {};
    const out: Record<string, PreciNetworkClientConfig> = {};
    for (const [id, val] of Object.entries(parsed)) {
      if (typeof val === 'string') {
        out[id] = { key: val, scopes: ['intent', 'categories'] };
      } else if (val && typeof val === 'object' && typeof val.key === 'string') {
        out[id] = {
          key: val.key,
          scopes: Array.isArray(val.scopes) ? val.scopes : ['intent'],
          label: val.label,
        };
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function preciNetworkKeysConfigured(): boolean {
  return Object.keys(parseNetworkKeys()).length > 0;
}

export function validarPreciNetworkAuth(
  authHeader: string | null,
  scopeRequired?: PreciNetworkScope
): PreciNetworkAuthResult {
  const token = extrairBearerToken(authHeader);
  if (!token) {
    return { ok: false, status: 401, error: 'Authorization Bearer obrigatório' };
  }

  const keys = parseNetworkKeys();
  if (Object.keys(keys).length === 0) {
    return { ok: false, status: 503, error: 'PRECI_NETWORK_API_KEYS não configurado' };
  }

  for (const [clientId, config] of Object.entries(keys)) {
    if (config.key === token) {
      if (scopeRequired && !config.scopes.includes(scopeRequired)) {
        return { ok: false, status: 403, error: `Escopo '${scopeRequired}' não autorizado` };
      }
      return { ok: true, clientId, config };
    }
  }

  return { ok: false, status: 401, error: 'Chave PRECI Network inválida' };
}
