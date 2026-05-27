import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import {
  getProvaSocialProduto,
  getProvaSocialBatch,
  getProvaSocialMercadoResumo,
} from '@/lib/prova-social-hiperlocal';

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

    const produtoId = req.nextUrl.searchParams.get('produtoId');
    const produtoIdsRaw = req.nextUrl.searchParams.get('produtoIds');

    if (produtoIdsRaw) {
      const ids = produtoIdsRaw.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 40);
      const map = await getProvaSocialBatch(mercadoId, ids);
      const porProduto: Record<string, unknown> = {};
      map.forEach((v, k) => {
        porProduto[k] = v;
      });
      return NextResponse.json({ success: true, data: { porProduto } });
    }

    if (produtoId) {
      const prova = await getProvaSocialProduto(mercadoId, produtoId);
      if (!prova) {
        return NextResponse.json({ success: true, data: null });
      }
      return NextResponse.json({ success: true, data: prova });
    }

    const resumo = await getProvaSocialMercadoResumo(mercadoId);
    return NextResponse.json({ success: true, data: resumo });
  } catch (e) {
    console.error('[prova-social GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
