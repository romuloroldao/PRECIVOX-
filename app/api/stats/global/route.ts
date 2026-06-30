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

// Fallback exibido quando o banco está indisponível. Mantém a landing page
// funcional (degradação graciosa) em vez de retornar 500 para todos os visitantes.
const FALLBACK_STATS = {
  totalUsers: 0,
  totalSavings: 0,
  savingsThisMonth: 0,
  activeMarkets: 0,
  lastUpdate: new Date(0).toISOString(),
  degraded: true as const,
};

async function handler(request: NextRequest) {
  try {
    // Buscar do cache Redis (5 minutos) ou do banco
    const data = await getCached(
      'stats:global',
      fetchStatsFromDB,
      300 // 5 minutos
    );

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache-Key': 'stats-global',
        },
      }
    );
  } catch (error) {
    // Log explícito e detalhado para investigação (não é falha silenciosa),
    // mas a resposta degrada para não derrubar a página pública.
    console.error('[API /stats/global] Falha ao buscar estatísticas — retornando fallback:', error);

    return NextResponse.json(
      { success: true, data: FALLBACK_STATS, degraded: true },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'X-Stats-Degraded': '1',
        },
      }
    );
  }
}

// Exportar função para invalidação
export { invalidate as invalidateStatsCache };

// Aplicar rate limiting: 100 req/min
export const GET = rateLimiters.statsGlobal(handler);
