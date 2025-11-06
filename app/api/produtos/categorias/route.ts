import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    // Buscar categorias distintas dos produtos
    const categorias = await prisma.produtos.findMany({
      select: {
        categoria: true
      },
      where: {
        categoria: {
          not: null
        },
        ativo: true
      },
      distinct: ['categoria'],
      orderBy: {
        categoria: 'asc'
      }
    });

    // Extrair e filtrar categorias únicas
    const categoriasUnicas = categorias
      .map(p => p.categoria)
      .filter((cat): cat is string => cat !== null && cat !== undefined)
      .filter((cat, index, arr) => arr.indexOf(cat) === index)
      .sort();

    return NextResponse.json(Array.isArray(categoriasUnicas) ? categoriasUnicas : [], {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('❌ Erro ao buscar categorias:', error);
    // Retorna array vazio em caso de erro para não quebrar o frontend
    return NextResponse.json(
      [],
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
