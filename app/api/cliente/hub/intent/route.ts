/**
 * POST /api/cliente/hub/intent — Hub PRECI (Fase 4).
 * Intent Detection (regras) → StructuredResponse → UI visual.
 */

import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { buildStructuredResponse, detectHubIntent } from '@/lib/hub/detect-intent';
import type { HubIntentId, HubIntentRequest, HubModality } from '@/lib/hub/types';

export const dynamic = 'force-dynamic';

const VALID_INTENTS = new Set<HubIntentId>([
  'add_items',
  'price_query',
  'build_weekly',
  'repeat_last',
  'recipe_or_occasion',
  'pantry_update',
  'substitute',
  'el_explain',
  'start_instore',
  'scan',
  'open_compare',
  'unknown',
]);

export async function POST(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });
    if (!user?.id || user.id === 'anonymous') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const body = (await req.json()) as HubIntentRequest;
    const input = typeof body.input === 'string' ? body.input : '';
    const modality: HubModality = body.modality || 'text';
    const context = body.context && typeof body.context === 'object' ? body.context : {};
    const hint =
      body.intentHint && VALID_INTENTS.has(body.intentHint) ? body.intentHint : undefined;

    if (!input.trim() && !hint) {
      return NextResponse.json(
        {
          success: true,
          data: buildStructuredResponse(
            { intent: 'unknown', confidence: 0, slots: {} },
            context
          ),
        }
      );
    }

    const detected = detectHubIntent(input || hint || '', context, hint);
    const response = buildStructuredResponse(detected, context);

    // Sempre explicável (Regra 4)
    if (!response.explanation?.trim()) {
      response.explanation = 'Pronto — siga na tela aberta.';
    }

    return NextResponse.json({
      success: true,
      data: {
        ...response,
        meta: { modality, userId: user.id },
      },
    });
  } catch (e) {
    console.error('[hub/intent]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
