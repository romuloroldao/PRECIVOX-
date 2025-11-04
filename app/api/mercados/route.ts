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

    // Simular retorno de mercados vazios para página funcionar
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

    // Retornar em formato esperado pelo frontend
    return NextResponse.json(mercados);
  } catch (error) {
    console.error('Erro ao buscar mercados:', error);
    // Retornar array vazio em caso de erro para não quebrar a página
    return NextResponse.json([]);
  }
}
