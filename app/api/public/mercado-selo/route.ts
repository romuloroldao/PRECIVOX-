import { NextRequest, NextResponse } from 'next/server';
import { obterSelosMercadosConsumidor } from '@/lib/mercado-selo-consumidor';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/mercado-selo?ids=id1,id2
 * Selos de confiança para exibição B2C (Tier 2+ com contrato e catálogo em dia).
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('ids') ?? '';
  const ids = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return NextResponse.json({ success: false, error: 'ids obrigatório' }, { status: 400 });
  }

  try {
    const selos = await obterSelosMercadosConsumidor(ids);
    return NextResponse.json({ success: true, data: selos });
  } catch (e) {
    console.error('[mercado-selo]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
