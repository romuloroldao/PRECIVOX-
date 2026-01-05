/**
 * Gamification Server-Side Helper
 * 
 * SQUAD B - Backend
 * 
 * Funções server-side para desbloquear badges automaticamente
 * (não usa fetch, chama diretamente o Prisma)
 */

import { prisma } from '@/lib/prisma';

/**
 * Calcula métricas do usuário baseado na ação
 */
async function calculateUserMetrics(
  userId: string,
  action: 'list_created' | 'savings_added' | 'referral_made' | 'daily_login',
  value?: number
): Promise<Record<string, number>> {
  const metrics: Record<string, number> = {};

  // Buscar métricas existentes do usuário
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
    },
  });

  if (!user) {
    return metrics;
  }

  // Contar listas criadas
  const totalLists = await prisma.listas_compras.count({
    where: { usuarioId: userId },
  });
  metrics['TOTAL_LISTS'] = totalLists;

  // Calcular economia total (soma de savings_history)
  if (action === 'savings_added' && value) {
    // Usar valor fornecido + buscar histórico
    const historyTotal = await prisma.savingsHistory.aggregate({
      where: { userId },
      _sum: { savings: true },
    });
    metrics['TOTAL_SAVINGS'] = (historyTotal._sum.savings || 0) + value;
  } else {
    // Buscar economia total do histórico
    const historyTotal = await prisma.savingsHistory.aggregate({
      where: { userId },
      _sum: { savings: true },
    });
    metrics['TOTAL_SAVINGS'] = historyTotal._sum.savings || 0;
  }

  // Buscar streak (dias consecutivos)
  const streak = await prisma.userStreak.findUnique({
    where: { userId },
    select: { currentStreak: true },
  });
  metrics['CONSECUTIVE_DAYS'] = streak?.currentStreak || 0;

  // Contar referrals (quando implementado)
  const referralsCount = await prisma.referral.count({
    where: {
      referrerId: userId,
      status: 'completed',
    },
  });
  metrics['TOTAL_REFERRALS'] = referralsCount;

  return metrics;
}

/**
 * Desbloqueia badges automaticamente (server-side)
 * 
 * Uso em APIs:
 * await autoUnlockBadgesServer(userId, 'list_created');
 * await autoUnlockBadgesServer(userId, 'savings_added', 5000);
 */
export async function autoUnlockBadgesServer(
  userId: string,
  action: 'list_created' | 'savings_added' | 'referral_made' | 'daily_login',
  value?: number
): Promise<{ unlocked: any[]; totalPoints: number }> {
  try {
    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { unlocked: [], totalPoints: 0 };
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

    // Calcular métricas do usuário
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

        // Enviar notificação push (não bloquear se falhar)
        try {
          const { notifyBadgeUnlocked } = await import('@/lib/notifications');
          await notifyBadgeUnlocked(userId, badge.name, badge.icon);
        } catch (error) {
          console.error('Error sending badge notification:', error);
          // Continuar mesmo se notificação falhar
        }
      }
    }

    // Calcular total de pontos
    const allUserBadges = await prisma.user_badges.findMany({
      where: { userId },
      include: { badges: true },
    });

    const totalPoints = allUserBadges.reduce(
      (sum, ub) => sum + ub.badges.points,
      0
    );

    return {
      unlocked: newlyUnlocked,
      totalPoints,
    };
  } catch (error) {
    console.error('Error auto-unlocking badges (server):', error);
    // Não bloquear fluxo principal se gamificação falhar
    return { unlocked: [], totalPoints: 0 };
  }
}

