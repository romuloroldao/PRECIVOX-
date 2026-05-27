import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { listarHistoricoTrocas } from '@/lib/troca-inteligente';

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

    const historico = await listarHistoricoTrocas(user.id, mercadoId);

    return NextResponse.json({
      success: true,
      data: { historico, total: historico.length },
    });
  } catch (e) {
    console.error('[troca-inteligente/historico]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
