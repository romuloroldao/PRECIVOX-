import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import {
  analisarVolatilidadeProduto,
  listarEsperaQueValeUsuario,
} from '@/lib/espera-que-vale';

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
    if (produtoId) {
      const analise = await analisarVolatilidadeProduto(produtoId, mercadoId);
      if (!analise) {
        return NextResponse.json(
          { success: false, error: 'Produto indisponível neste mercado' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: analise });
    }

    const lista = await listarEsperaQueValeUsuario(user.id, mercadoId);
    return NextResponse.json({ success: true, data: lista });
  } catch (e) {
    console.error('[espera-que-vale GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
