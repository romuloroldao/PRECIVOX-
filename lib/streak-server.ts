/**
 * Streak Server-Side Helper
 * 
 * SQUAD B - Backend
 * 
 * Funções server-side para gerenciar streaks
 */

import { prisma } from '@/lib/prisma';

/**
 * Calcula diferença em dias entre duas datas
 */
function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / oneDay);
}

/**
 * Verifica e atualiza streak do usuário
 * Retorna novo streak e se desbloqueou badge
 */
export async function checkAndUpdateStreak(
  userId: string
): Promise<{
  streak: number;
  isNew: boolean;
  isNewRecord: boolean;
  longestStreak: number;
  shouldUnlockBadge: boolean;
}> {
  try {
    // Buscar streak do usuário
    let streak = await prisma.userStreak.findUnique({
      where: { userId },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Se não existe, criar
    if (!streak) {
      streak = await prisma.userStreak.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastLogin: today,
        },
      });

      return {
        streak: 1,
        isNew: true,
        isNewRecord: false,
        longestStreak: 1,
        shouldUnlockBadge: false, // Precisa de 7 dias
      };
    }

    // Calcular dias desde último login
    const lastLogin = new Date(streak.lastLogin);
    lastLogin.setHours(0, 0, 0, 0);
    const diffDays = daysBetween(lastLogin, today);

    // Atualizar streak
    if (diffDays === 0) {
      // Já logou hoje, não fazer nada
      return {
        streak: streak.currentStreak,
        isNew: false,
        isNewRecord: false,
        longestStreak: streak.longestStreak,
        shouldUnlockBadge: false,
      };
    } else if (diffDays === 1) {
      // Login consecutivo, incrementar
      const newStreak = streak.currentStreak + 1;
      const newLongest = Math.max(newStreak, streak.longestStreak);

      await prisma.userStreak.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastLogin: today,
        },
      });

      // Verificar se deve desbloquear badge (7 ou 30 dias)
      const shouldUnlockBadge = newStreak === 7 || newStreak === 30;

      // Enviar notificação de milestone (7, 30, 100 dias)
      if (newStreak === 7 || newStreak === 30 || newStreak === 100) {
        try {
          const { notifyStreakMilestone } = await import('@/lib/notifications');
          await notifyStreakMilestone(userId, newStreak);
        } catch (error) {
          console.error('Error sending streak milestone notification:', error);
          // Continuar mesmo se notificação falhar
        }
      }

      return {
        streak: newStreak,
        isNew: false,
        isNewRecord: newStreak > streak.longestStreak,
        longestStreak: newLongest,
        shouldUnlockBadge,
      };
    } else {
      // Quebrou streak (diffDays > 1), resetar
      await prisma.userStreak.update({
        where: { userId },
        data: {
          currentStreak: 1,
          lastLogin: today,
        },
      });

      return {
        streak: 1,
        isNew: false,
        isNewRecord: false,
        longestStreak: streak.longestStreak,
        shouldUnlockBadge: false,
      };
    }
  } catch (error) {
    console.error('Error checking streak:', error);
    // Retornar valores padrão se falhar
    return {
      streak: 0,
      isNew: false,
      isNewRecord: false,
      longestStreak: 0,
      shouldUnlockBadge: false,
    };
  }
}

