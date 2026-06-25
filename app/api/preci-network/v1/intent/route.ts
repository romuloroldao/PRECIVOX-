import { NextRequest, NextResponse } from 'next/server';
import { validarPreciNetworkAuth } from '@/lib/preci-network/auth';
import { agregarIntentRegional } from '@/lib/preci-network/intent-aggregator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/preci-network/v1/intent
 * Query: mercadoId (referência regional), dias (default 14), regiaoModo=cep5|cidade
 * Auth: Bearer PRECI_NETWORK_API_KEYS
 */
export async function GET(req: NextRequest) {
  const auth = validarPreciNetworkAuth(req.headers.get('authorization'), 'intent');
  if (auth.ok === false) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const mercadoId = req.nextUrl.searchParams.get('mercadoId')?.trim() ?? '';
  if (!mercadoId) {
    return NextResponse.json(
      { success: false, error: 'mercadoId obrigatório (mercado de referência regional)' },
      { status: 400 }
    );
  }

  const diasRaw = parseInt(req.nextUrl.searchParams.get('dias') ?? '14', 10);
  const dias = Number.isFinite(diasRaw) ? Math.min(Math.max(diasRaw, 7), 30) : 14;
  const modoParam = req.nextUrl.searchParams.get('regiaoModo');
  const regiaoModo = modoParam === 'cidade' ? 'cidade' : 'cep5';

  try {
    const data = await agregarIntentRegional(mercadoId, dias, regiaoModo);
    return NextResponse.json({
      success: true,
      clientId: auth.clientId,
      data,
    });
  } catch (e) {
    console.error('[preci-network/v1/intent]', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao agregar intenção regional' },
      { status: 500 }
    );
  }
}
