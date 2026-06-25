/**
 * Registry de provedores OAuth/OIDC (Adapter pattern).
 *
 * Cada provider implementa:
 *   async exchangeAndVerify({ code, codeVerifier, redirectUri, profileName }) -> NormalizedProfile
 *
 * NormalizedProfile = {
 *   sub: string,                // identificador estável do provedor (chave de junção)
 *   email: string|null,
 *   emailVerified: boolean,
 *   isPrivateRelay: boolean,    // Apple Hide My Email
 *   name: string|null,
 *   avatar: string|null,
 *   providerAccessToken?: string|null,
 *   providerRefreshToken?: string|null,
 *   providerTokenExpires?: Date|null,
 *   raw?: object,
 * }
 */
import { googleProvider } from './google.provider.js';
import { facebookProvider } from './facebook.provider.js';
import { appleProvider } from './apple.provider.js';

const PROVIDERS = {
  GOOGLE: googleProvider,
  FACEBOOK: facebookProvider,
  APPLE: appleProvider,
};

/**
 * @param {string} provider - 'GOOGLE' | 'FACEBOOK' | 'APPLE' (case-insensitive)
 */
export function getProviderAdapter(provider) {
  const key = String(provider || '').toUpperCase();
  const adapter = PROVIDERS[key];
  if (!adapter) {
    const err = new Error(`Provedor não suportado: ${provider}`);
    err.statusCode = 400;
    throw err;
  }
  return adapter;
}

export const SUPPORTED_PROVIDERS = Object.keys(PROVIDERS);
