import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const categorias = await prisma.produtos.findMany({
      select: {
        categoria: true
      },
      where: {
        categoria: {
          not: null
        }
      },
      distinct: ['categoria'],
      orderBy: {
        categoria: 'asc'
      }
    });

    const categoriasUnicas = categorias
      .map(p => p.categoria)
      .filter((cat, index, arr) => arr.indexOf(cat) === index)
      .filter(Boolean);

    return NextResponse.json(categoriasUnicas);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
