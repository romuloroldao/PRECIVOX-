import { createRequire } from 'node:module';

const { getJwtSecret } = createRequire(import.meta.url)('../../lib/jwt-secret.cjs');

export { getJwtSecret };
