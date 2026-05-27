import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { sincronizarItensCorredor } from '@/lib/modo-mercado-vivo';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });
    if (!user?.id || user.id === 'anonymous') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const mercadoId = body.mercadoId as string | undefined;
    const itens = body.itens as Parameters<typeof sincronizarItensCorredor>[1];

    if (!mercadoId || !Array.isArray(itens)) {
      return NextResponse.json(
        { success: false, error: 'mercadoId e itens obrigatórios' },
        { status: 400 }
      );
    }

    const sincronizados = await sincronizarItensCorredor(mercadoId, itens);

    return NextResponse.json({
      success: true,
      data: { itens: sincronizados },
    });
  } catch (e) {
    console.error('[modo-mercado-vivo/itens POST]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
