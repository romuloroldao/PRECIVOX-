import { NextRequest, NextResponse } from 'next/server';
import { getSugestoesPricingAssistido } from '@/lib/pricing-assistido';
import { requireGestorApiAccess } from '@/lib/gestor-api-mercado';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireGestorApiAccess(req, req.nextUrl.searchParams.get('mercadoId'));
    if (!auth.ok) return auth.response;
    const { mercadoId } = auth;

    const limite = parseInt(req.nextUrl.searchParams.get('limite') || '8', 10);
    const data = await getSugestoesPricingAssistido(mercadoId, limite);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('[pricing-assistido GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
