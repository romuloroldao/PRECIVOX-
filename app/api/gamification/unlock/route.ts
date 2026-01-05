/**
 * POST /api/gamification/unlock
 * 
 * SQUAD B - Backend
 * 
 * Verifica e desbloqueia badges automaticamente
 * Rate Limit: 30 req/min
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, value } = body;

    // Validação
    if (!userId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'userId e action são obrigatórios',
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

    // Buscar badges já desbloqueados
    const unlockedBadges = await prisma.user_badges.findMany({
      where: { userId },
      select: { badgeId: true },
    });

    const unlockedIds = new Set(unlockedBadges.map((ub) => ub.badgeId));

    // Buscar badges disponíveis (não desbloqueados)
    const availableBadges = await prisma.badges.findMany({
      where: {
        id: {
          notIn: Array.from(unlockedIds),
        },
      },
    });

    // Calcular métricas do usuário baseado na ação
    const userMetrics = await calculateUserMetrics(userId, action, value);

    // Verificar quais badges podem ser desbloqueados
    const newlyUnlocked: any[] = [];

    for (const badge of availableBadges) {
      const metricValue = userMetrics[badge.requirementType] || 0;
      
      if (metricValue >= badge.requirementValue) {
        // Desbloquear badge
        await prisma.user_badges.create({
          data: {
            userId,
            badgeId: badge.id,
            progress: badge.requirementValue,
          },
        });

        newlyUnlocked.push({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          points: badge.points,
        });
      }
    }

    // Calcular total de pontos
    const totalPoints = await prisma.user_badges.findMany({
      where: { userId },
      include: { badges: true },
    }).then((badges) => 
      badges.reduce((sum, ub) => sum + ub.badges.points, 0)
    );

    const response = {
      success: true,
      data: {
        newlyUnlocked,
        totalPoints,
        message: newlyUnlocked.length > 0 
          ? `Parabéns! Você desbloqueou ${newlyUnlocked.length} badge(s)!`
          : 'Nenhum badge novo desbloqueado',
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error unlocking badges:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erro ao desbloquear badges',
      },
      { status: 500 }
    );
  }
}

// Função auxiliar para calcular métricas do usuário
async function calculateUserMetrics(
  userId: string, 
  action: string, 
  value?: number
): Promise<Record<string, number>> {
  const metrics: Record<string, number> = {};

  // Total de economia (em centavos)
  // TODO: Implementar cálculo real de economia
  metrics.total_savings = value || 0;

  // Total de listas criadas
  const listsCount = await prisma.listas_compras.count({
    where: { usuarioId: userId },
  });
  metrics.lists_created = listsCount;

  // Streak de dias (simulado)
  // TODO: Implementar lógica real de streak
  metrics.streak_days = 1;

  // Referrals (simulado)
  // TODO: Implementar sistema de referral
  metrics.referrals = 0;

  return metrics;
}
