import { NextResponse } from 'next/server';
import { getCatalogoResumoMercados } from '@/lib/mercados-catalogo-stats';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const data = await getCatalogoResumoMercados();
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('[catalogo-resumo]', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar resumo' }, { status: 500 });
  }
}
