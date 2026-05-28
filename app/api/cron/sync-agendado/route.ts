import { NextRequest, NextResponse } from 'next/server';
import { executarSyncsDevidos } from '@/lib/sync-agendado';

export const dynamic = 'force-dynamic';

/**
 * Disparo do sync agendado (cron externo ou scheduler interno).
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
    const resumo = await executarSyncsDevidos();
    return NextResponse.json({ success: true, data: resumo });
  } catch (e) {
    console.error('[cron/sync-agendado]', e);
    return NextResponse.json({ success: false, error: 'Erro no sync' }, { status: 500 });
  }
}
