/**
 * Resolução centralizada do segredo JWT (CommonJS — backend Express legado).
 * Mantém mesma lógica de lib/jwt-secret.ts.
 */

const INSECURE_PLACEHOLDERS = new Set([
  'fallback-secret-change-in-production',
  'seu-secret-super-seguro',
  'your-secret-key',
  'precivox-secret-2024',
  'precivox-secret-key-2024',
  'test-secret-key',
]);

const MIN_LENGTH = 16;

function pickRawSecret() {
  return (process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || '').trim();
}

function isUsableSecret(value) {
  return value.length >= MIN_LENGTH && !INSECURE_PLACEHOLDERS.has(value);
}

function getJwtSecret() {
  const raw = pickRawSecret();

  if (isUsableSecret(raw)) {
    return raw;
  }

  if (process.env.NODE_ENV === 'test') {
    const testSecret =
      process.env.JWT_SECRET?.trim() ||
      process.env.NEXTAUTH_SECRET?.trim() ||
      'test-secret-key-for-jest-min-16';
    if (isUsableSecret(testSecret) || testSecret.length >= MIN_LENGTH) {
      return testSecret;
    }
  }

  if (process.env.NODE_ENV === 'development') {
    throw new Error(
      'JWT_SECRET ou NEXTAUTH_SECRET (mín. 16 caracteres) é obrigatório em desenvolvimento. ' +
        'Copie .env.example para .env.local e defina um valor seguro.',
    );
  }

  throw new Error(
    'JWT_SECRET ou NEXTAUTH_SECRET deve estar configurado em produção (mín. 16 caracteres, sem placeholders).',
  );
}

module.exports = { getJwtSecret };
