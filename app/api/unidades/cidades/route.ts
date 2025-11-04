import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const cidades = await prisma.unidades.findMany({
      select: {
        cidade: true
      },
      where: {
        cidade: {
          not: null
        }
      },
      distinct: ['cidade'],
      orderBy: {
        cidade: 'asc'
      }
    });

    const cidadesUnicas = cidades
      .map(u => u.cidade)
      .filter((cidade, index, arr) => arr.indexOf(cidade) === index)
      .filter(Boolean);

    return NextResponse.json(cidadesUnicas);
  } catch (error) {
    console.error('Erro ao buscar cidades:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
