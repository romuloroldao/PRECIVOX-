import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { montarCestaProvavel } from '@/lib/cesta-provavel';
import { MarketBehaviorEngine } from '@/lib/ai/behavior-engine';
import { inferirDiaMercado } from '@/lib/cesta-provavel';

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

    const [cesta, behavior] = await Promise.all([
      montarCestaProvavel(user.id, mercadoId),
      MarketBehaviorEngine.analyzeUserBehavior(user.id, mercadoId, 30),
    ]);

    const diaMercado = inferirDiaMercado(behavior.data.horariosPico);

    return NextResponse.json({
      success: true,
      data: {
        ...cesta,
        diaMercado,
        notificacaoSugerida: diaMercado
          ? `Seu dia de mercado costuma ser ${diaMercado.label} — revise sua cesta antes.`
          : cesta.mensagem,
      },
    });
  } catch (e) {
    console.error('[cesta-provavel]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
