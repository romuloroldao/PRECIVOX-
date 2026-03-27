import { NextRequest, NextResponse } from 'next/server';
import { EventCollector } from '@/lib/ai/event-collector';
import type { UserEventType } from '@/lib/ai/types';

const ALLOWED_TYPES: UserEventType[] = [
  'lista_criada',
  'produto_adicionado_lista',
  'produto_removido_lista',
  'produto_buscado',
  'produto_visualizado',
  'compra_realizada',
  'promocao_visualizada',
  'horario_acesso',
  'produto_substituicao_aceita',
  'remocao_lista_confirmada',
  'rota_consolidacao_lista',
];

/**
 * Recebe eventos de analytics/IA do browser (nunca usar Prisma no cliente).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, userId, mercadoId, metadata } = body as {
      type?: string;
      userId?: string;
      mercadoId?: string;
      metadata?: Record<string, unknown>;
    };

    if (!type || !userId || !mercadoId) {
      return NextResponse.json({ success: false, error: 'Campos obrigatórios' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(type as UserEventType)) {
      return NextResponse.json({ success: false, error: 'Tipo inválido' }, { status: 400 });
    }

    await EventCollector.recordEvent(
      String(userId),
      String(mercadoId),
      type as UserEventType,
      (metadata && typeof metadata === 'object' ? metadata : {}) as Record<string, unknown>
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[api/events/track]', e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
