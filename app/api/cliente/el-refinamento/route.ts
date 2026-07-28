import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { confirmarRefinamentoEl, desfazerRefinamentoEl } from '@/lib/el-refinamento';

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
    const acao = body.acao as string;

    if (acao === 'confirmar') {
      await confirmarRefinamentoEl(user.id);
    } else if (acao === 'desfazer') {
      await desfazerRefinamentoEl(user.id);
    } else {
      return NextResponse.json({ success: false, error: 'acao inválida' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[el-refinamento POST]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
