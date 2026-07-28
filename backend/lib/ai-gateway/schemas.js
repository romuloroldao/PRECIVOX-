/**
 * Validação leve de schemas JSON — sem dependência externa.
 * Garante campos críticos nas respostas do LLM.
 */

/** @type {Record<string, { required: string[]; arrays?: string[] }>} */
export const RESPONSE_SCHEMAS = {
  'shopping-list-analysis': {
    required: ['insights'],
    arrays: ['insights', 'sugestoes', 'alternativas'],
  },
  'product-alternatives': {
    required: ['alternativas'],
    arrays: ['alternativas'],
  },
  'route-optimization': {
    required: ['rota_otimizada'],
    arrays: ['rota_otimizada'],
  },
  'price-analysis': {
    required: ['insights'],
    arrays: ['insights', 'recomendacoes', 'alertas'],
  },
};

/**
 * @param {string} taskId
 * @param {unknown} data
 * @returns {{ valid: boolean; errors: string[] }}
 */
export function validateResponse(taskId, data) {
  const schema = RESPONSE_SCHEMAS[taskId];
  const errors = [];

  if (!schema) return { valid: true, errors: [] };
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Resposta não é um objeto JSON'] };
  }

  const obj = /** @type {Record<string, unknown>} */ (data);

  for (const field of schema.required) {
    if (obj[field] == null) errors.push(`Campo obrigatório ausente: ${field}`);
  }

  for (const field of schema.arrays || []) {
    if (obj[field] != null && !Array.isArray(obj[field])) {
      errors.push(`Campo ${field} deve ser array`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * @param {string} content
 * @param {string} taskId
 */
export function parseAndValidate(content, taskId) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { ok: false, data: null, errors: ['JSON inválido'] };
  }
  const { valid, errors } = validateResponse(taskId, parsed);
  return { ok: valid, data: parsed, errors };
}
