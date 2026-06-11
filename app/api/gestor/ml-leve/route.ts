import { NextRequest, NextResponse } from 'next/server';
import { getMlLeveResumoMercado } from '@/lib/ml-leve/mercado-resumo';
import { requireGestorApiAccess } from '@/lib/gestor-api-mercado';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireGestorApiAccess(req, req.nextUrl.searchParams.get('mercadoId'));
    if (!auth.ok) return auth.response;
    const { mercadoId } = auth;

    const data = await getMlLeveResumoMercado(mercadoId);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('[gestor/ml-leve]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
