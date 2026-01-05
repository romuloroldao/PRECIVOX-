/**
 * GET /api/gamification/progress
 * 
 * SQUAD B - Backend
 * 
 * Retorna progresso do usuário em badges específicos
 * Cache: 5 minutos
 * Rate Limit: 60 req/min
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

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

    // Buscar badges não desbloqueados
    const unlockedBadgeIds = await prisma.user_badges.findMany({
      where: { userId },
      select: { badgeId: true },
    }).then((badges) => badges.map((b) => b.badgeId));

    const lockedBadges = await prisma.badges.findMany({
      where: {
        id: {
          notIn: unlockedBadgeIds,
        },
      },
      orderBy: { points: 'asc' },
    });

    // Calcular progresso atual do usuário
    const userMetrics = await calculateCurrentMetrics(userId);

    // Calcular progresso para cada badge
    const progress = lockedBadges.map((badge) => {
      const currentValue = userMetrics[badge.requirementType] || 0;
      const progressPercentage = Math.min(
        Math.round((currentValue / badge.requirementValue) * 100),
        100
      );

      return {
        badgeId: badge.id,
        name: badge.name,
        icon: badge.icon,
        category: badge.category,
        currentValue,
        requiredValue: badge.requirementValue,
        progressPercentage,
        remaining: Math.max(badge.requirementValue - currentValue, 0),
      };
    });

    // Ordenar por progresso (mais próximos primeiro)
    progress.sort((a, b) => b.progressPercentage - a.progressPercentage);

    const response = {
      success: true,
      data: {
        progress,
        nextBadge: progress[0] || null,
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache-Key': `progress-${userId}`,
      },
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erro ao buscar progresso',
      },
      { status: 500 }
    );
  }
}

// Função auxiliar para calcular métricas atuais
async function calculateCurrentMetrics(userId: string): Promise<Record<string, number>> {
  const metrics: Record<string, number> = {};

  // Total de listas criadas
  const listsCount = await prisma.listas_compras.count({
    where: { usuarioId: userId },
  });
  metrics.lists_created = listsCount;

  // Total de economia (simulado)
  // TODO: Implementar cálculo real
  metrics.total_savings = 0;

  // Streak de dias (simulado)
  // TODO: Implementar lógica real
  metrics.streak_days = 1;

  // Referrals (simulado)
  // TODO: Implementar sistema de referral
  metrics.referrals = 0;

  return metrics;
}
