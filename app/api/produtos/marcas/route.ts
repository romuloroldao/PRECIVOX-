import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    // Buscar marcas distintas dos produtos
    const marcas = await prisma.produtos.findMany({
      select: {
        marca: true
      },
      where: {
        marca: {
          not: null
        },
        ativo: true
      },
      distinct: ['marca'],
      orderBy: {
        marca: 'asc'
      }
    });

    // Extrair e filtrar marcas únicas
    const marcasUnicas = marcas
      .map(p => p.marca)
      .filter((marca): marca is string => marca !== null && marca !== undefined)
      .filter((marca, index, arr) => arr.indexOf(marca) === index)
      .sort();

    return NextResponse.json(Array.isArray(marcasUnicas) ? marcasUnicas : [], {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('❌ Erro ao buscar marcas:', error);
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
