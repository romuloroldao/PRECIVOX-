import { NextRequest, NextResponse } from 'next/server';
import { isGestorAuthResponse, requireGestorApiAccess } from '@/lib/gestor-api-mercado';
import { loadStockHealth } from '@/lib/ai-engines-from-db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const mercadoId = typeof body.mercadoId === 'string' ? body.mercadoId : null;

    const auth = await requireGestorApiAccess(req, mercadoId);
    if (isGestorAuthResponse(auth)) return auth.response;

    const data = await loadStockHealth(auth.mercadoId);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[API ai-engines/stock-health]', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao analisar saúde do estoque' },
      { status: 500 }
    );
  }
}
