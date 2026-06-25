/**
 * Resolução centralizada do segredo JWT.
 * Em produção não há fallback inseguro — falha se JWT_SECRET ausente.
 */

import { getJwtSecret as getJwtSecretCjs } from './jwt-secret.cjs';

const INSECURE_PLACEHOLDERS = new Set([
  'fallback-secret-change-in-production',
  'seu-secret-super-seguro',
  'your-secret-key',
  'precivox-secret-2024',
  'precivox-secret-key-2024',
  'test-secret-key',
]);

export { INSECURE_PLACEHOLDERS };

/**
 * Retorna o segredo para assinatura/verificação JWT (HS256 via jose).
 * @throws Error se não houver segredo válido no ambiente atual
 */
export function getJwtSecret(): string {
  return getJwtSecretCjs();
}
