/**
 * GET /api/lists
 *
 * SQUAD B - Backend
 *
 * Lista listas de compras do usuário
 * Query: userId (obrigatório), limit (opcional, default 50)
 * Cache: 1 minuto por userId
 * Rate Limit: 60 req/min
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimiters } from '@/lib/rate-limiter';
import { getCached } from '@/lib/redis';

export const dynamic = 'force-dynamic';

async function fetchListsFromDB(userId: string, limit: number) {
  const listas = await prisma.listas_compras.findMany({
    where: { usuarioId: userId },
    orderBy: { updatedAt: 'desc' },
    take: Math.min(limit, 100),
    include: {
      itens_lista: true,
    },
  });

  const lists = listas.map((lista) => {
    const itemsCount = lista.itens_lista?.length ?? 0;
    let totalSavings = 0;
    return {
      id: lista.id,
      name: lista.nome,
      itemsCount,
      totalSavings,
      updatedAt: lista.updatedAt.toISOString(),
      archived: !lista.ativo,
    };
  });

  return { lists };
}

async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'userId é obrigatório',
        },
        { status: 400 }
      );
    }

    const cacheKey = `lists:${userId}:${limit}`;
    const data = await getCached(
      cacheKey,
      () => fetchListsFromDB(userId, limit),
      60
    );

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
          'X-Cache-Key': cacheKey,
        },
      }
    );
  } catch (error: any) {
    const isTableMissing =
      error?.message?.includes('does not exist') ||
      error?.code === 'P2021' ||
      (error?.meta?.table && !error?.meta?.cause);

    if (isTableMissing) {
      return NextResponse.json(
        { success: true, data: { lists: [] } },
        { headers: { 'Cache-Control': 'private, s-maxage=10' } }
      );
    }
    console.error('Error fetching lists:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erro ao buscar listas',
      },
      { status: 500 }
    );
  }
}

export const GET = rateLimiters.listsGet(handler);
