import { NextRequest, NextResponse } from 'next/server';
import { getReputacaoMercadoCrowd } from '@/lib/crowd-v2/reputacao-mercado';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const mercadoId = req.nextUrl.searchParams.get('mercadoId');
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }

    const data = await getReputacaoMercadoCrowd(mercadoId);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('[crowd/reputacao-mercado]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
