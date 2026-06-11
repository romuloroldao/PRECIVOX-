import { NextRequest, NextResponse } from 'next/server';
import { executarMlLeveBatch } from '@/lib/ml-leve/batch';

export const dynamic = 'force-dynamic';

/**
 * Cron: batch ML leve — churn + elasticidade por usuário (Épico 12)
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
    const limite = parseInt(req.nextUrl.searchParams.get('limite') || '400', 10);
    const resumo = await executarMlLeveBatch({ limiteUsuarios: limite });
    return NextResponse.json({ success: true, data: resumo });
  } catch (e) {
    console.error('[cron/ml-leve-batch]', e);
    return NextResponse.json({ success: false, error: 'Erro no batch ML leve' }, { status: 500 });
  }
}
