import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());

const SCAN_DIRS = [
  join(ROOT, 'lib'),
  join(ROOT, 'app'),
  join(ROOT, 'src'),
].filter((d) => existsSync(d));

/**
 * Arquivos legados com jwt.verify — não adicionar novos; usar lib/jwt (jose) + TokenManager.
 * @see docs/auth-v2.md
 */
const GRANDFATHERED_JWT_VERIFY = new Set([
  'src/middleware/auth.ts',
  'src/routes/mercados.ts',
]);

/** Imports jsonwebtoken permitidos até migração para jose. */
const GRANDFATHERED_JSONWEBTOKEN = new Set([
  'app/api-proxy/products/upload-smart/[marketId]/route.ts',
  'src/middleware/auth.ts',
  'src/routes/mercados.ts',
]);

function walk(dir, ext = '.ts') {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.next') continue;
      out.push(...walk(full, ext));
    } else if (extname(full) === ext) {
      out.push(full);
    }
  }
  return out;
}

function rel(file) {
  return file.replace(/\\/g, '/').replace(ROOT + '/', '');
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

const tsFiles = SCAN_DIRS.flatMap((d) => walk(d, '.ts'));

console.log('\n[AUTH-GUARD] Checking jwt.verify usage in lib/, app/, src/...');
for (const file of tsFiles) {
  const content = readFileSync(file, 'utf8');
  if (!content.includes('jwt.verify(')) continue;
  if (!GRANDFATHERED_JWT_VERIFY.has(rel(file))) {
    fail(`[AUTH-GUARD] FAIL: jwt.verify in non-grandfathered file -> ${rel(file)}`);
  }
}

console.log('[AUTH-GUARD] Checking jsonwebtoken imports...');
for (const file of tsFiles) {
  const content = readFileSync(file, 'utf8');
  const hasImport =
    /from\s+['"]jsonwebtoken['"]|require\s*\(\s*['"]jsonwebtoken['"]\s*\)/.test(content);
  if (!hasImport) continue;
  if (!GRANDFATHERED_JSONWEBTOKEN.has(rel(file)) && !rel(file).startsWith('lib/')) {
    fail(`[AUTH-GUARD] FAIL: jsonwebtoken import in non-grandfathered file -> ${rel(file)}`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('[AUTH-GUARD] OK');
