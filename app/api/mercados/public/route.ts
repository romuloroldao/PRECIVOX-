import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo');

    const where = ativo === 'true' ? { ativo: true } : {};

    const mercados = await prisma.mercados.findMany({
      where,
      select: {
        id: true,
        nome: true,
        ativo: true,
        dataCriacao: true,
      },
      orderBy: {
        nome: 'asc',
      },
      take: 20,
    });

    return NextResponse.json(mercados);
  } catch (error: any) {
    console.error('Erro ao buscar mercados públicos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar mercados', message: error.message },
      { status: 500 }
    );
  }
}
