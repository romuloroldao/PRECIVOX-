import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { resolverSkuPorProdutoId } from '@/lib/sku-nacional/resolver';

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

    const produtoId = req.nextUrl.searchParams.get('produtoId');
    if (!produtoId) {
      return NextResponse.json({ success: false, error: 'produtoId obrigatório' }, { status: 400 });
    }

    const data = await resolverSkuPorProdutoId(produtoId);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('[cliente/sku-nacional]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
