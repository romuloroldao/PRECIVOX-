import { NextRequest, NextResponse } from 'next/server';
import { validarPreciNetworkAuth } from '@/lib/preci-network/auth';
import { agregarIntentRegional } from '@/lib/preci-network/intent-aggregator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/preci-network/v1/categories
 * Retorna apenas categorias agregadas (subset da intent API)
 */
export async function GET(req: NextRequest) {
  const auth = validarPreciNetworkAuth(req.headers.get('authorization'), 'categories');
  if (auth.ok === false) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const mercadoId = req.nextUrl.searchParams.get('mercadoId')?.trim() ?? '';
  if (!mercadoId) {
    return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
  }

  const diasRaw = parseInt(req.nextUrl.searchParams.get('dias') ?? '14', 10);
  const dias = Number.isFinite(diasRaw) ? Math.min(Math.max(diasRaw, 7), 30) : 14;

  try {
    const resumo = await agregarIntentRegional(mercadoId, dias);
    return NextResponse.json({
      success: true,
      clientId: auth.clientId,
      data: {
        regiaoDescricao: resumo.regiaoDescricao,
        periodoDias: resumo.periodoDias,
        categorias: resumo.categorias,
        lgpd: resumo.lgpd,
        geradoEm: resumo.geradoEm,
      },
    });
  } catch (e) {
    console.error('[preci-network/v1/categories]', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao agregar categorias' },
      { status: 500 }
    );
  }
}
