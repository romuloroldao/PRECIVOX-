import { NextRequest, NextResponse } from 'next/server';
import {
  getBenchmarkPrecoRegional,
  parseRegiaoPrecoParam,
} from '@/lib/benchmark-preco-regional';
import { requireGestorApiAccess } from '@/lib/gestor-api-mercado';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireGestorApiAccess(req, req.nextUrl.searchParams.get('mercadoId'));
    if (!auth.ok) return auth.response;
    const { mercadoId } = auth;

    const regiaoPreco = parseRegiaoPrecoParam(req.nextUrl.searchParams.get('regiaoPreco'));
    const raioKm = Math.min(200, Math.max(1, parseInt(req.nextUrl.searchParams.get('raioKm') || '25', 10)));
    const limite = parseInt(req.nextUrl.searchParams.get('limite') || '12', 10);

    const data = await getBenchmarkPrecoRegional(mercadoId, regiaoPreco, raioKm, limite);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('[benchmark-preco GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
