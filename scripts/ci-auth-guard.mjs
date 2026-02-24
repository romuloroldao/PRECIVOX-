import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const BACKEND_SRC = join(ROOT, 'apps', 'backend', 'src');
const ALLOWED_VERIFY_FILE = join(BACKEND_SRC, 'auth', 'validate-access-token.ts');
const RESTRICTED_IMPORT_SCOPE = join(BACKEND_SRC, 'auth');

function walk(dir, ext = '.ts') {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full, ext));
    else if (extname(full) === ext) out.push(full);
  }
  return out;
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

console.log('\n[AUTH-GUARD] Checking jwt.verify usage...');
const tsFiles = walk(BACKEND_SRC, '.ts');
for (const file of tsFiles) {
  const content = readFileSync(file, 'utf8');
  if (!content.includes('jwt.verify(')) continue;
  if (file !== ALLOWED_VERIFY_FILE) {
    fail(`[AUTH-GUARD] FAIL: jwt.verify found outside canonical file -> ${file.replace(ROOT + '/', '')}`);
  }
}

console.log('[AUTH-GUARD] Checking jsonwebtoken imports...');
for (const file of tsFiles) {
  const content = readFileSync(file, 'utf8');
  const hasImport = /from\s+['"]jsonwebtoken['"]|require\s*\(\s*['"]jsonwebtoken['"]\s*\)/.test(content);
  if (!hasImport) continue;
  if (!file.startsWith(RESTRICTED_IMPORT_SCOPE)) {
    fail(`[AUTH-GUARD] FAIL: jsonwebtoken import outside auth scope -> ${file.replace(ROOT + '/', '')}`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('[AUTH-GUARD] OK');

