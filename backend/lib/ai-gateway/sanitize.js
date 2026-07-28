/**
 * Proteção contra prompt injection em dados de usuário.
 * Delimita entradas e remove padrões de override de instrução.
 */

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/gi,
  /disregard\s+(all\s+)?(previous|above|prior)/gi,
  /you\s+are\s+now\s+/gi,
  /system\s*:\s*/gi,
  /\[INST\]/gi,
  /<\|im_start\|>/gi,
  /```\s*system/gi,
];

const MAX_FIELD_LENGTH = 2000;
const MAX_ARRAY_ITEMS = 50;

/**
 * Sanitiza texto livre inserido em prompts de usuário.
 * @param {unknown} value
 * @param {number} [maxLen]
 * @returns {string}
 */
export function sanitizeUserText(value, maxLen = MAX_FIELD_LENGTH) {
  if (value == null) return '';
  let text = String(value).trim();
  if (text.length > maxLen) text = text.slice(0, maxLen);
  for (const pattern of INJECTION_PATTERNS) {
    text = text.replace(pattern, '[removido]');
  }
  return text;
}

/**
 * Envolve dados do usuário em delimitadores explícitos.
 * @param {string} label
 * @param {string} content
 */
export function wrapUserData(label, content) {
  return `<<<${label}>>>\n${content}\n<<</${label}>>>`;
}

/**
 * Sanitiza objeto de produto para prompts.
 * @param {Record<string, unknown>} product
 */
export function sanitizeProduct(product) {
  if (!product || typeof product !== 'object') return {};
  return {
    nome: sanitizeUserText(product.nome || product.name, 200),
    preco: Number(product.preco ?? product.price) || 0,
    loja: sanitizeUserText(product.loja || product.store, 100),
    categoria: sanitizeUserText(product.categoria || product.category, 100),
  };
}

/**
 * Sanitiza lista de itens de compra.
 * @param {Array<{ produto?: Record<string, unknown>; quantidade?: number }>} items
 */
export function sanitizeListItems(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, MAX_ARRAY_ITEMS).map((item) => ({
    produto: sanitizeProduct(item?.produto || {}),
    quantidade: Math.min(Math.max(Number(item?.quantidade) || 1, 1), 999),
  }));
}
