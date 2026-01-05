/**
 * GET /api/stats/global
 * 
 * SQUAD B - Backend
 * 
 * Retorna estatísticas globais da plataforma
 * Cache: 5 minutos
 * Rate Limit: 100 req/min
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimiters } from '@/lib/rate-limiter';
import { getCached, invalidate } from '@/lib/redis';

export const dynamic = 'force-dynamic';

async function fetchStatsFromDB() {
  // Buscar estatísticas reais do banco
    const [totalUsers, totalLists, totalSavingsData] = await Promise.all([
      // Total de usuários
      prisma.user.count(),
      
      // Total de listas criadas
      prisma.listas_compras.count(),
      
      // Economia total (simulado por enquanto)
      // TODO: Implementar cálculo real de economia
      Promise.resolve(23456700), // R$ 234.567,00 em centavos
    ]);

    // Calcular economia do mês atual
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const savingsThisMonth = Math.floor(totalSavingsData * 0.23); // ~23% do total

    // Contar mercados ativos
    const activeMarkets = await prisma.mercados.count({
      where: {
        ativo: true,
      },
    });

  return {
    totalUsers,
    totalSavings: totalSavingsData,
    savingsThisMonth,
    activeMarkets,
    lastUpdate: new Date().toISOString(),
  };
}

async function handler(request: NextRequest) {
  try {
    // Buscar do cache Redis (5 minutos) ou do banco
    const data = await getCached(
      'stats:global',
      fetchStatsFromDB,
      300 // 5 minutos
    );

    const response = {
      success: true,
      data,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache-Key': 'stats-global',
      },
    });
  } catch (error) {
    console.error('Error fetching global stats:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erro ao buscar estatísticas globais',
      },
      { status: 500 }
    );
  }
}

// Exportar função para invalidação
export { invalidate as invalidateStatsCache };

// Aplicar rate limiting: 100 req/min
export const GET = rateLimiters.statsGlobal(handler);
