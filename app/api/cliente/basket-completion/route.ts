import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { sugerirBasketCompletion } from '@/lib/ml-leve/basket-completion';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });
    if (!user?.id || user.id === 'anonymous') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const mercadoId = req.nextUrl.searchParams.get('mercadoId');
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }

    const raw = req.nextUrl.searchParams.get('produtoIds') ?? '';
    const produtoIds = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const limite = Math.min(12, parseInt(req.nextUrl.searchParams.get('limite') || '6', 10));

    const data = await sugerirBasketCompletion(user.id, mercadoId, produtoIds, limite);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('[basket-completion]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
