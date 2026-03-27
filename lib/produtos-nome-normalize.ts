/**
 * Normalização de nomes de produto para insights agregados (não depender só de SKU/EAN).
 * Redes escrevem o mesmo item de formas diferentes; esta chave aproxima o "mesmo produto lógico"
 * para comparações e tendências.
 */

const STOPWORDS = new Set(
  [
    'a',
    'o',
    'os',
    'as',
    'um',
    'uma',
    'uns',
    'umas',
    'de',
    'da',
    'do',
    'das',
    'dos',
    'em',
    'no',
    'na',
    'nos',
    'nas',
    'ao',
    'aos',
    'com',
    'sem',
    'por',
    'para',
    'pra',
    'pro',
    'que',
    'e',
    'ou',
    'se',
    'como',
    'mais',
    'menos',
    'tipo',
    'tamanho',
    'kg',
    'g',
    'gr',
    'l',
    'ml',
    'lt',
    'un',
    'und',
    'unid',
    'pct',
    'cx',
    'pacote',
    'embalagem',
    'refil',
    'leve',
    'pague',
    'unidade',
    // Classe genérica (não discrimina o mesmo item entre redes)
    'sabao',
    'detergente',
    'amaciante',
    'alvejante',
    'limpador',
    'desinfetante',
  ].map((w) => w.toLowerCase())
);

export function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '');
}

/** Um token alfanumérico minúsculo, sem acento. */
function sanitizeToken(raw: string): string {
  const t = stripDiacritics(raw).toLowerCase().replace(/[^a-z0-9]/g, '');
  return t.length >= 2 ? t : '';
}

function tokensFromTexto(texto: string): string[] {
  const rough = stripDiacritics(texto)
    .toLowerCase()
    .replace(/[^a-z0-9áàâãéêíóôõúç\s]/gi, ' ');
  const parts = rough.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    const t = sanitizeToken(p);
    if (!t || STOPWORDS.has(t)) continue;
    out.push(t);
  }
  return out;
}

/** Grafias alternativas de token → canônico (manter pequeno para reduzir falso positivo). */
const CANONICO_TOKEN: Map<string, string> = new Map([['tixan', 'omo']]);

function aplicarCanonicoToken(t: string): string {
  return CANONICO_TOKEN.get(t) ?? t;
}

function tokensCanonico(texto: string): string[] {
  return tokensFromTexto(texto).map(aplicarCanonicoToken);
}

/**
 * Nome normalizado com sinônimos de marca aplicados e tokens ordenados.
 */
export function normalizeNomeProdutoChaveComSinonimos(nome: string): string {
  const tokens = tokensCanonico(nome);
  if (tokens.length === 0) return '';
  const uniq = [...new Set(tokens)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  return uniq.join(' ');
}

/**
 * Chave canônica a partir do nome (inclui sinônimos de marca leves).
 */
export function normalizeNomeProdutoChave(nome: string): string {
  return normalizeNomeProdutoChaveComSinonimos(nome);
}

/**
 * Mesma lógica para termos digitados na busca, alinhada à chave de nome de produto.
 */
export function normalizeTermoBuscaChave(raw: string): string {
  return normalizeNomeProdutoChave(raw).slice(0, 200);
}

function normalizeRotuloCurto(s: string | null | undefined): string {
  if (!s?.trim()) return '';
  return stripDiacritics(s.trim()).toLowerCase().replace(/\s+/g, ' ');
}

export function jaccardTokensDeNomes(a: string, b: string): number {
  const ta = new Set(normalizeNomeProdutoChaveComSinonimos(a).split(/\s+/).filter(Boolean));
  const tb = new Set(normalizeNomeProdutoChaveComSinonimos(b).split(/\s+/).filter(Boolean));
  if (ta.size === 0 && tb.size === 0) return 1;
  let inter = 0;
  for (const x of ta) {
    if (tb.has(x)) inter++;
  }
  const uni = ta.size + tb.size - inter;
  return uni === 0 ? 0 : inter / uni;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + c);
    }
  }
  return dp[m]![n]!;
}

/** Razão 0–1; útil só para strings curtas (marcas, rótulos). */
export function similaridadeLevenshteinRatio(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const d = levenshtein(a, b);
  return 1 - d / Math.max(a.length, b.length, 1);
}

/**
 * Heurística conservadora: evita fundir produtos diferentes.
 * Ajuste thresholds conforme dados reais.
 */
export function nomesProdutoProvavelmenteMesmoItem(a: string, b: string): boolean {
  const k1 = normalizeNomeProdutoChaveComSinonimos(a);
  const k2 = normalizeNomeProdutoChaveComSinonimos(b);
  if (k1 && k1 === k2) return true;
  const j = jaccardTokensDeNomes(a, b);
  if (j >= 0.88) return true;
  if (k1.length >= 8 && k2.length >= 8 && similaridadeLevenshteinRatio(k1, k2) >= 0.92) return true;
  return false;
}

export function buildChaveProdutoParaInsights(input: {
  nome: string;
  codigoBarras?: string | null;
  marca?: string | null;
  categoria?: string | null;
}): string {
  const digits = input.codigoBarras?.replace(/\D/g, '') ?? '';
  if (digits.length >= 8) {
    return `ean:${digits}`;
  }
  const nomeChave = normalizeNomeProdutoChaveComSinonimos(input.nome);
  const m = normalizeRotuloCurto(input.marca ?? null);
  const c = normalizeRotuloCurto(input.categoria ?? null);
  if (!nomeChave && !m && !c) {
    return 'nome:vazio';
  }
  return `nome:${nomeChave || '—'}|m:${m || '—'}|c:${c || '—'}`;
}
