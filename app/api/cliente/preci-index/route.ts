import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { calcularPreciIndexCesta, parseRegiaoPrecoParam } from '@/lib/preci-index-cesta';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const mercadoId = req.nextUrl.searchParams.get('mercadoId')?.trim();
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }

    const regiaoPreco = parseRegiaoPrecoParam(req.nextUrl.searchParams.get('regiaoPreco'));
    const raioKm = Math.min(200, Math.max(1, parseInt(req.nextUrl.searchParams.get('raioKm') || '25', 10)));

    const data = await calcularPreciIndexCesta(mercadoId, regiaoPreco, raioKm);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('[preci-index cliente GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
