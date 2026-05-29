import { NextRequest, NextResponse } from 'next/server';
import { executarPushRetencao } from '@/lib/push-retencao';

export const dynamic = 'force-dynamic';

/**
 * Cron: push cesta provável + dia de mercado (2.3 / 6.3)
 * Header: Authorization: Bearer ${CRON_SECRET}
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { success: false, error: 'CRON_SECRET não configurado' },
      { status: 503 }
    );
  }

  const auth = req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const resumo = await executarPushRetencao();
    return NextResponse.json({ success: true, data: resumo });
  } catch (e) {
    console.error('[cron/push-retencao]', e);
    return NextResponse.json({ success: false, error: 'Erro no push de retenção' }, { status: 500 });
  }
}
