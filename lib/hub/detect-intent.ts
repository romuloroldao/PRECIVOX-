/**
 * Detecção de intent por regras (Fase 4) — sem LLM.
 * Testável: entrada → DetectedIntent.
 */

import type { DetectedIntent, HubIntentContext, HubIntentId } from '@/lib/hub/types';

function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Extrai quantidade + produto de frases tipo "adiciona 2 leite" / "coloca arroz". */
export function extractAddItems(raw: string): { query: string; qty: number } | null {
  const t = normalize(raw);
  const m = t.match(
    /^(?:adiciona|adicione|adicionar|coloca|coloque|poe|ponha|bota|inclui|incluir)\s+(?:(\d+)\s+)?(.+)$/i
  );
  if (!m) return null;
  const qty = m[1] ? Math.max(1, parseInt(m[1], 10) || 1) : 1;
  const query = (m[2] || '').replace(/\bna lista\b/g, '').trim();
  if (!query || query.length < 2) return null;
  return { query, qty };
}

function matchAny(t: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(t));
}

/**
 * Classifica intent. `intentHint` (chip) tem prioridade absoluta.
 */
export function detectHubIntent(
  input: string,
  context: HubIntentContext = {},
  intentHint?: HubIntentId
): DetectedIntent {
  if (intentHint && intentHint !== 'unknown') {
    return {
      intent: intentHint,
      confidence: 1,
      slots: hintSlots(intentHint, input),
    };
  }

  const t = normalize(input);
  if (!t) {
    return { intent: 'unknown', confidence: 0, slots: { raw: input } };
  }

  // Código de barras puro (foto / OCR → mesmo pipeline do scanner)
  if (/^(\d{8}|\d{13})$/.test(t.replace(/\s/g, ''))) {
    return {
      intent: 'scan',
      confidence: 0.98,
      slots: { ean: t.replace(/\s/g, '') },
    };
  }

  // Scanner
  if (matchAny(t, [/^(escanear|scanner|scan|ler etiqueta|codigo de barras)/, /\betiqueta\b/])) {
    return { intent: 'scan', confidence: 0.95, slots: {} };
  }

  // Mercado ao vivo / corredor
  if (
    matchAny(t, [
      /estou (no|no mercado|no supermercado)/,
      /modo corredor/,
      /cheguei no mercado/,
      /no mercado agora/,
    ])
  ) {
    return { intent: 'start_instore', confidence: 0.93, slots: {} };
  }

  // Compra da semana
  if (
    matchAny(t, [
      /compra da semana/,
      /montar (a )?compra/,
      /monte (a )?compra/,
      /cesta da semana/,
      /montar cesta/,
    ])
  ) {
    return { intent: 'build_weekly', confidence: 0.94, slots: {} };
  }

  // Repetir compra
  if (matchAny(t, [/repete?(r)? (minha )?compra/, /compra passada/, /ultima compra/, /de novo a lista/])) {
    return { intent: 'repeat_last', confidence: 0.9, slots: {} };
  }

  // Despensa
  if (matchAny(t, [/acabou (o |a )?/, /ainda tem /, /na despensa/, /repor /, /esta acabando/])) {
    const produto = t
      .replace(/^acabou (o |a )?/, '')
      .replace(/^ainda tem (o |a )?/, '')
      .replace(/ na despensa.*$/, '')
      .trim();
    return {
      intent: 'pantry_update',
      confidence: 0.88,
      slots: { produto: produto || undefined, estado: t.includes('acabou') ? 'acabando' : 'ok' },
    };
  }

  // EL / vale ir
  if (matchAny(t, [/vale (a pena )?ir/, /economia liquida/, /vale a viagem/, /fica(r)? (aqui|no)/])) {
    const dest = t.match(/(?:no|em)\s+(.+?)(\?|$)/);
    return {
      intent: 'el_explain',
      confidence: 0.87,
      slots: { destinoLabel: dest?.[1]?.trim() || undefined },
    };
  }

  // Comparar / preço
  if (matchAny(t, [/compara(r)? (preco|preços|precos)/, /quanto custa/, /preco (do|de|da)/])) {
    const produto =
      t.match(/quanto custa\s+(.+?)(?:\s+no\s+|$)/)?.[1] ||
      t.match(/compara(?:r)?(?:\s+precos?)?(?:\s+de)?\s+(.+)$/)?.[1] ||
      t.match(/preco (?:do|de|da)\s+(.+)$/)?.[1];
    const mercado = t.match(/\bno\s+(.+)$/)?.[1];
    const isCompare = /compara/.test(t);
    return {
      intent: isCompare ? 'open_compare' : 'price_query',
      confidence: 0.9,
      slots: {
        produto: produto?.replace(/\s+no\s+.*$/, '').trim(),
        mercado: mercado?.trim(),
      },
    };
  }

  // Substituição
  if (matchAny(t, [/opcao mais barata/, /substitut/, /troca inteligente/, /tem outra marca/])) {
    return { intent: 'substitute', confidence: 0.85, slots: {} };
  }

  // Ocasião / receita
  if (
    matchAny(t, [
      /estou fazendo/,
      /vou fazer/,
      /receita/,
      /churrasco/,
      /lasanha/,
      /feijoada/,
      /almoco/,
      /jantar/,
    ])
  ) {
    return {
      intent: 'recipe_or_occasion',
      confidence: 0.8,
      slots: { ocasiao: t },
    };
  }

  // Adicionar itens
  const add = extractAddItems(t);
  if (add) {
    return {
      intent: 'add_items',
      confidence: 0.92,
      slots: { items: [{ query: add.query, qty: add.qty }] },
    };
  }

  // Geofence ambíguo → in-store
  if (context.geofenceAtivo && t.length < 24) {
    return { intent: 'start_instore', confidence: 0.7, slots: { raw: input } };
  }

  // Lista vazia + menção genérica a compra → weekly
  if (context.listaVazia && matchAny(t, [/comprar/, /lista/, /mercado/])) {
    return { intent: 'build_weekly', confidence: 0.65, slots: {} };
  }

  // Frase curta → busca como add_items fraco
  if (t.length >= 2 && t.length <= 40 && !/[?]/.test(t) && t.split(' ').length <= 4) {
    return {
      intent: 'add_items',
      confidence: 0.55,
      slots: { items: [{ query: t, qty: 1 }] },
    };
  }

  return { intent: 'unknown', confidence: 0.2, slots: { raw: input } };
}

function hintSlots(hint: HubIntentId, input: string): Record<string, unknown> {
  if (hint === 'add_items') {
    const add = extractAddItems(input) || (input.trim() ? { query: input.trim(), qty: 1 } : null);
    return add ? { items: [add] } : {};
  }
  if (hint === 'price_query' || hint === 'open_compare') {
    return { produto: input.trim() || undefined };
  }
  if (hint === 'pantry_update') {
    return { produto: input.trim() || undefined };
  }
  return {};
}

/** Monta StructuredResponse a partir da detecção (sem chamar tools externas). */
export function buildStructuredResponse(
  detected: DetectedIntent,
  context: HubIntentContext = {}
): import('@/lib/hub/types').StructuredResponse {
  const { intent, confidence, slots } = detected;

  switch (intent) {
    case 'scan':
      return {
        intent,
        confidence,
        slots,
        toolsUsed: ['scan-inteligente'],
        explanation: slots.ean
          ? 'Código lido — abrindo o scanner para confirmar.'
          : 'Abrindo o scanner para ler a etiqueta.',
        ui: {
          type: 'scanner',
          payload: slots.ean ? { ean: slots.ean } : {},
          href: context.mercadoId
            ? `/cliente/scan?mercadoId=${encodeURIComponent(context.mercadoId)}`
            : '/cliente/scan',
        },
      };

    case 'start_instore':
      return {
        intent,
        confidence,
        slots,
        toolsUsed: ['modo-mercado-vivo'],
        explanation: 'Abrindo o modo corredor para marcar itens no mercado.',
        ui: { type: 'mercado_vivo', payload: {}, href: '/cliente/mercado-vivo' },
      };

    case 'build_weekly':
      return {
        intent,
        confidence,
        slots,
        toolsUsed: ['cesta-semana', 'despensa'],
        explanation: 'Vamos montar a compra da semana para você revisar.',
        ui: {
          type: 'rascunho_compra',
          payload: { action: 'montar-semana' },
          href: '/cliente/compra?montar=1',
        },
      };

    case 'repeat_last':
      return {
        intent,
        confidence,
        slots,
        toolsUsed: ['lists'],
        explanation: 'Abrindo suas listas para repetir uma compra anterior.',
        ui: { type: 'lista_inteligente', payload: {}, href: '/cliente/listas' },
      };

    case 'pantry_update': {
      const produto = typeof slots.produto === 'string' ? slots.produto : '';
      return {
        intent,
        confidence,
        slots,
        toolsUsed: ['despensa'],
        explanation: produto
          ? `Abrindo a despensa para atualizar “${produto}”.`
          : 'Abrindo a despensa da casa.',
        ui: { type: 'despensa', payload: { produto }, href: '/cliente/despensa' },
      };
    }

    case 'el_explain':
      return {
        intent,
        confidence,
        slots,
        toolsUsed: ['economia-liquida'],
        explanation:
          'Para dizer se vale ir, precisamos dos preços e da distância. Abrindo a comparação na busca.',
        ui: {
          type: 'el_detail',
          payload: { destinoLabel: slots.destinoLabel },
          href: '/cliente/busca',
        },
      };

    case 'price_query':
    case 'open_compare': {
      const produto = typeof slots.produto === 'string' ? slots.produto.trim() : '';
      const params = new URLSearchParams();
      if (produto) params.set('q', produto);
      if (intent === 'open_compare') params.set('comparar', '1');
      if (context.mercadoId) params.set('mercadoId', context.mercadoId);
      const qs = params.toString();
      return {
        intent,
        confidence,
        slots,
        toolsUsed: ['produtos/buscar'],
        explanation: produto
          ? `Buscando preços de “${produto}”.`
          : 'Abrindo a busca para comparar preços.',
        ui: {
          type: intent === 'open_compare' ? 'compare' : 'search_results',
          payload: { produto },
          href: qs ? `/cliente/busca?${qs}` : '/cliente/busca',
        },
      };
    }

    case 'substitute':
      return {
        intent,
        confidence,
        slots,
        toolsUsed: ['troca-inteligente'],
        explanation: 'Abra um item na compra para ver opções de troca.',
        ui: { type: 'substitute_sheet', payload: {}, href: '/cliente/compra' },
      };

    case 'recipe_or_occasion':
      return {
        intent,
        confidence,
        slots,
        toolsUsed: ['sugestoes-lista', 'basket-completion'],
        explanation: 'Vamos montar uma lista a partir dessa ocasião — revise na compra.',
        ui: {
          type: 'lista_inteligente',
          payload: { ocasiao: slots.ocasiao },
          href: '/cliente/compra?montar=1',
        },
      };

    case 'add_items': {
      const items = Array.isArray(slots.items) ? slots.items : [];
      const first = items[0] as { query?: string; qty?: number } | undefined;
      const query = first?.query?.trim() || '';
      const qty = first?.qty || 1;
      if (!query) {
        return {
          intent: 'unknown',
          confidence: 0.3,
          slots,
          toolsUsed: [],
          explanation: 'Diga o que deseja adicionar, por exemplo: “Adiciona leite”.',
          ui: { type: 'hub_clarify', payload: {} },
        };
      }
      return {
        intent,
        confidence,
        slots,
        toolsUsed: ['produtos/buscar'],
        explanation:
          qty > 1
            ? `Buscando “${query}” (qtd. ${qty}) para incluir na compra.`
            : `Buscando “${query}” para incluir na compra.`,
        ui: {
          type: 'search_results',
          payload: { query, qty },
          href: `/cliente/busca?q=${encodeURIComponent(query)}`,
        },
      };
    }

    default:
      return {
        intent: 'unknown',
        confidence,
        slots,
        toolsUsed: [],
        explanation: 'Escolha uma tarefa abaixo ou diga o que a casa precisa.',
        ui: { type: 'hub_clarify', payload: { raw: slots.raw } },
      };
  }
}
