import { NextRequest, NextResponse } from 'next/server';
import { EventCollector } from '@/lib/ai/event-collector';
import type { UserEventType } from '@/lib/ai/types';
import { TokenManager } from '@/lib/token-manager';

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
  'preco_confirmado',
  'preco_reportado',
  'checkin_mercado',
  'compra_confirmada',
  'compra_parcial',
  'compra_nao_realizada',
];

/**
 * Recebe eventos de analytics/IA do browser (nunca usar Prisma no cliente).
 * userId vem sempre da sessão autenticada — não confiar no body.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });

    if (!user?.id || user.id === 'anonymous') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { type, mercadoId, metadata } = body as {
      type?: string;
      userId?: string;
      mercadoId?: string;
      metadata?: Record<string, unknown>;
    };

    if (!type || !mercadoId) {
      return NextResponse.json({ success: false, error: 'Campos obrigatórios' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(type as UserEventType)) {
      return NextResponse.json({ success: false, error: 'Tipo inválido' }, { status: 400 });
    }

    if (body.userId && body.userId !== user.id) {
      console.warn('[api/events/track] userId do body ignorado (spoofing bloqueado)', {
        bodyUserId: body.userId,
        sessionUserId: user.id,
      });
    }

    await EventCollector.recordEvent(
      user.id,
      String(mercadoId),
      type as UserEventType,
      (metadata && typeof metadata === 'object' ? metadata : {}) as Record<string, unknown>,
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[api/events/track]', e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
