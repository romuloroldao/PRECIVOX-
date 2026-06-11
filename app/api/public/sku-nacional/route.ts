import { NextRequest, NextResponse } from 'next/server';
import { buscarOfertasPorSkuNacional } from '@/lib/sku-nacional/resolver';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sku = req.nextUrl.searchParams.get('sku')?.trim();
    if (!sku) {
      return NextResponse.json({ success: false, error: 'sku obrigatório' }, { status: 400 });
    }
    const excluirMercadoId = req.nextUrl.searchParams.get('excluirMercadoId') ?? undefined;
    const data = await buscarOfertasPorSkuNacional(sku, { excluirMercadoId, limit: 16 });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('[public/sku-nacional]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
