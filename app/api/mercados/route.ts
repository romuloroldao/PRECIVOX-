import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo');

    const where = ativo === 'true' ? { ativo: true } : {};

    const mercados = await prisma.mercados.findMany({
      where,
      include: {
        unidades: {
          where: {
            ativa: true
          },
          select: {
            id: true,
            nome: true,
            cidade: true,
            estado: true,
            endereco: true,
            ativa: true
          }
        }
      },
      orderBy: {
        nome: 'asc',
      },
      take: 100,
    });

    // Sempre retorna array, mesmo que vazio
    return NextResponse.json(Array.isArray(mercados) ? mercados : [], {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('❌ Erro ao buscar mercados:', error);
    
    // Em caso de erro, retorna array vazio para não quebrar o frontend
    // mas também loga o erro para debug
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
