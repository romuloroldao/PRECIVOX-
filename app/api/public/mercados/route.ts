import { NextRequest, NextResponse } from 'next/server';
import { getPublicMarkets } from '@/lib/publicMarkets';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo');

    const mercados = await getPublicMarkets({ ativo });

    return NextResponse.json(mercados, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('❌ Erro ao buscar mercados públicos:', error);

    return NextResponse.json([], {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

