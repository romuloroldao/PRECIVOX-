/**
 * GET /api/savings/history
 * 
 * SQUAD B - Backend
 * 
 * Retorna histórico de economia do usuário
 * Suporta agregação por período
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCached } from '@/lib/redis';

export const dynamic = 'force-dynamic';

/**
 * Obter data de início baseado no período
 */
function getStartDate(period: string): Date {
  const now = new Date();
  const start = new Date(now);

  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setMonth(now.getMonth() - 1); // Default: último mês
  }

  return start;
}

/**
 * Agregar economia por período
 */
function aggregateByPeriod(history: any[], period: string) {
  const aggregated: Record<string, number> = {};

  history.forEach((record) => {
    const date = new Date(record.date);
    let key: string;

    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = String(date.getFullYear());
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    aggregated[key] = (aggregated[key] || 0) + record.savings;
  });

  return aggregated;
}

async function fetchSavingsHistory(userId: string, period: string = 'month') {
  const startDate = getStartDate(period);

  // Buscar histórico
  const history = await prisma.savingsHistory.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
      },
    },
    orderBy: { date: 'desc' },
    include: {
      product: {
        select: {
          id: true,
          nome: true,
        },
      },
      list: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  });

  // Agregar por período
  const aggregated = aggregateByPeriod(history, period);

  // Calcular totais
  const totalSavings = history.reduce((sum, record) => sum + record.savings, 0);
  const totalRecords = history.length;

  return {
    history: history.map((record) => ({
      id: record.id,
      productId: record.productId,
      productName: record.product?.nome,
      listId: record.listId,
      listName: record.list?.nome,
      pricePaid: record.pricePaid,
      avgPrice: record.avgPrice,
      savings: record.savings,
      date: record.date.toISOString(),
    })),
    aggregated,
    totals: {
      totalSavings,
      totalRecords,
      averageSavings: totalRecords > 0 ? Math.round(totalSavings / totalRecords) : 0,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || 'month';

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

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Usuário não encontrado',
        },
        { status: 404 }
      );
    }

    // Buscar do cache Redis (5 minutos) ou do banco
    const cacheKey = `savings:history:${userId}:${period}`;
    const data = await getCached(
      cacheKey,
      () => fetchSavingsHistory(userId, period),
      300 // 5 minutos
    );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching savings history:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erro ao buscar histórico de economia',
      },
      { status: 500 }
    );
  }
}

