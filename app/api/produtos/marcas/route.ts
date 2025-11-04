import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const marcas = await prisma.produtos.findMany({
      select: {
        marca: true
      },
      where: {
        marca: {
          not: null
        }
      },
      distinct: ['marca'],
      orderBy: {
        marca: 'asc'
      }
    });

    const marcasUnicas = marcas
      .map(p => p.marca)
      .filter((marca, index, arr) => arr.indexOf(marca) === index)
      .filter(Boolean);

    return NextResponse.json(marcasUnicas);
  } catch (error) {
    console.error('Erro ao buscar marcas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
