import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    // Buscar cidades distintas das unidades
    const cidades = await prisma.unidades.findMany({
      select: {
        cidade: true
      },
      where: {
        cidade: {
          not: null
        },
        ativa: true
      },
      distinct: ['cidade'],
      orderBy: {
        cidade: 'asc'
      }
    });

    // Extrair e filtrar cidades únicas
    const cidadesUnicas = cidades
      .map(u => u.cidade)
      .filter((cidade): cidade is string => cidade !== null && cidade !== undefined)
      .filter((cidade, index, arr) => arr.indexOf(cidade) === index)
      .sort();

    return NextResponse.json(Array.isArray(cidadesUnicas) ? cidadesUnicas : [], {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('❌ Erro ao buscar cidades:', error);
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
