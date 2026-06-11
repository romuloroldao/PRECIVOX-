import { NextRequest, NextResponse } from 'next/server';
import { backfillSkuNacionalBatch } from '@/lib/sku-nacional/resolver';

export const dynamic = 'force-dynamic';

/** Cron: backfill SKU nacional + embeddings (Épico 15). */
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
    const take = parseInt(req.nextUrl.searchParams.get('take') || '800', 10);
    const skip = parseInt(req.nextUrl.searchParams.get('skip') || '0', 10);
    const data = await backfillSkuNacionalBatch({ take, skip });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('[cron/sku-nacional-batch]', e);
    return NextResponse.json({ success: false, error: 'Erro no batch SKU nacional' }, { status: 500 });
  }
}
