/**
 * Provider Groq — única implementação de LLM externo.
 * Outros provedores devem implementar a mesma interface em providers/.
 */

import Groq from 'groq-sdk';
import { MODEL_PROFILES } from '../config.js';

/** @type {Groq | null} */
let client = null;

function getClient() {
  if (!process.env.GROQ_API_KEY) return null;
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

/**
 * @param {object} params
 * @param {string} params.model
 * @param {Array<{ role: string; content: string }>} params.messages
 * @param {number} params.temperature
 * @param {number} params.maxTokens
 * @param {number} params.timeoutMs
 */
export async function groqComplete({ model, messages, temperature, maxTokens, timeoutMs }) {
  const groq = getClient();
  if (!groq) {
    const err = new Error('GROQ_API_KEY não configurada');
    err.code = 'PROVIDER_UNAVAILABLE';
    throw err;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const completion = await groq.chat.completions.create(
      {
        messages,
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      },
      { signal: controller.signal }
    );

    const choice = completion.choices?.[0];
    const content = choice?.message?.content;
    if (!content) throw new Error('Resposta vazia do provedor');

    const usage = completion.usage || {};
    return {
      content,
      model: completion.model || model,
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
      },
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error(`Timeout após ${timeoutMs}ms`);
      timeoutErr.code = 'TIMEOUT';
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {string} profile
 */
export function resolveModel(profile) {
  return MODEL_PROFILES[profile] || MODEL_PROFILES.reasoning;
}

export function isProviderConfigured() {
  return Boolean(process.env.GROQ_API_KEY);
}

export function getConfiguredModels() {
  return { ...MODEL_PROFILES };
}
