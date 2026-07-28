/**
 * Tipos do Hub PRECI — StructuredResponse (Fase 4).
 * @see docs/PROPOSTA_AI_NATIVE_SHOPPING_JOURNEY.md
 */

export type HubIntentId =
  | 'add_items'
  | 'price_query'
  | 'build_weekly'
  | 'repeat_last'
  | 'recipe_or_occasion'
  | 'pantry_update'
  | 'substitute'
  | 'el_explain'
  | 'start_instore'
  | 'scan'
  | 'open_compare'
  | 'unknown';

export type HubUiType =
  | 'lista_inteligente'
  | 'rascunho_compra'
  | 'preco_card'
  | 'compare'
  | 'despensa'
  | 'substitute_sheet'
  | 'el_detail'
  | 'mercado_vivo'
  | 'scanner'
  | 'search_results'
  | 'hub_clarify'
  | 'none';

export type HubModality = 'text' | 'voice' | 'photo' | 'scanner' | 'context';

export type HubIntentContext = {
  casaId?: string;
  listaAtivaId?: string;
  mercadoId?: string;
  unidadeId?: string;
  geofenceAtivo?: boolean;
  coords?: { lat: number; lng: number } | null;
  listaVazia?: boolean;
};

export type HubIntentRequest = {
  input: string;
  modality?: HubModality;
  context?: HubIntentContext;
  intentHint?: HubIntentId;
};

export type StructuredResponse = {
  intent: HubIntentId;
  confidence: number;
  slots: Record<string, unknown>;
  toolsUsed: string[];
  explanation: string;
  ui: {
    type: HubUiType;
    payload: Record<string, unknown>;
    href?: string;
  };
};

export type DetectedIntent = {
  intent: HubIntentId;
  confidence: number;
  slots: Record<string, unknown>;
};
