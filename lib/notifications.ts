/**
 * Notification Service
 * 
 * SQUAD B - Backend
 * 
 * Serviço centralizado para enviar notificações push
 * Integra com FCM e gerencia subscriptions
 */

import { prisma } from '@/lib/prisma';
import { deliverPushToToken, isPushDeliveryAvailable } from './push-delivery';

/**
 * Tipos de notificações
 */
export type NotificationType =
  | 'BADGE_UNLOCKED'
  | 'STREAK_REMINDER'
  | 'STREAK_MILESTONE'
  | 'SAVINGS_ALERT'
  | 'REFERRAL_COMPLETED'
  | 'LIST_SHARED'
  | 'PRICE_DROP'
  | 'CESTA_PROVAVEL'
  | 'DIA_MERCADO';

/**
 * Enviar notificação para um usuário
 */
export async function sendNotificationToUser(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; sent: number }> {
  if (!isPushDeliveryAvailable()) {
    console.warn('Push não disponível, notificação não enviada');
    return { success: false, sent: 0 };
  }

  try {
    const subscriptions = await prisma.notificationSubscription.findMany({
      where: {
        userId,
        enabled: true,
      },
      select: {
        token: true,
      },
    });

    if (subscriptions.length === 0) {
      return { success: true, sent: 0 };
    }

    let sent = 0;
    const invalidTokens: string[] = [];

    for (const { token } of subscriptions) {
      const result = await deliverPushToToken(token, title, body, {
        ...data,
        type,
        userId,
      });
      if (result.success) sent++;
      else if (result.error === 'INVALID_TOKEN') invalidTokens.push(token);
    }

    if (invalidTokens.length > 0) {
      await prisma.notificationSubscription.deleteMany({
        where: { token: { in: invalidTokens } },
      });
    }

    return {
      success: sent > 0,
      sent,
    };
  } catch (error) {
    console.error('Error sending notification to user:', error);
    return { success: false, sent: 0 };
  }
}

/**
 * Notificação: Badge desbloqueado
 */
export async function notifyBadgeUnlocked(
  userId: string,
  badgeName: string,
  badgeIcon: string
): Promise<void> {
  await sendNotificationToUser(
    userId,
    'BADGE_UNLOCKED',
    '🎉 Novo Badge Desbloqueado!',
    `Parabéns! Você desbloqueou o badge "${badgeName}"`,
    {
      link: '/cliente/badges',
      badgeName,
      badgeIcon,
    }
  );
}

/**
 * Notificação: Lembrete de streak (se não usar por 1 dia)
 */
export async function notifyStreakReminder(userId: string, currentStreak: number): Promise<void> {
  await sendNotificationToUser(
    userId,
    'STREAK_REMINDER',
    '🔥 Não perca seu streak!',
    `Você tem ${currentStreak} dias consecutivos. Faça login hoje para continuar!`,
    {
      link: '/cliente/home',
      streak: currentStreak.toString(),
    }
  );
}

/**
 * Notificação: Milestone de streak (7, 30 dias)
 */
export async function notifyStreakMilestone(
  userId: string,
  streak: number
): Promise<void> {
  await sendNotificationToUser(
    userId,
    'STREAK_MILESTONE',
    '🔥 Milestone Alcançado!',
    `Parabéns! Você alcançou ${streak} dias consecutivos!`,
    {
      link: '/cliente/badges',
      streak: streak.toString(),
    }
  );
}

/**
 * Notificação: Alerta de economia (produto em promoção)
 */
export async function notifySavingsAlert(
  userId: string,
  productName: string,
  savings: number
): Promise<void> {
  const savingsFormatted = (savings / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  await sendNotificationToUser(
    userId,
    'SAVINGS_ALERT',
    '💰 Oportunidade de Economia!',
    `${productName} está com desconto! Economize ${savingsFormatted}`,
    {
      link: '/cliente/produtos',
      productName,
      savings: savings.toString(),
    }
  );
}

/**
 * Notificação: Referral completado
 */
export async function notifyReferralCompleted(
  userId: string,
  refereeName: string
): Promise<void> {
  await sendNotificationToUser(
    userId,
    'REFERRAL_COMPLETED',
    '🎁 Referral Completado!',
    `${refereeName} se cadastrou usando seu código! Você ganhou recompensas.`,
    {
      link: '/cliente/referrals',
      refereeName,
    }
  );
}

/**
 * Notificação: Lista compartilhada
 */
export async function notifyListShared(
  userId: string,
  listName: string,
  sharerName: string
): Promise<void> {
  await sendNotificationToUser(
    userId,
    'LIST_SHARED',
    '📝 Nova Lista Compartilhada',
    `${sharerName} compartilhou a lista "${listName}" com você`,
    {
      link: '/cliente/listas',
      listName,
      sharerName,
    }
  );
}

/**
 * Notificação: Queda de preço
 */
export async function notifyPriceDrop(
  userId: string,
  productName: string,
  oldPrice: number,
  newPrice: number
): Promise<void> {
  const savings = oldPrice - newPrice;
  const savingsFormatted = (savings / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  await sendNotificationToUser(
    userId,
    'PRICE_DROP',
    '📉 Queda de Preço!',
    `${productName} caiu de preço! Economize ${savingsFormatted}`,
    {
      link: '/cliente/produtos',
      productName,
      oldPrice: oldPrice.toString(),
      newPrice: newPrice.toString(),
    }
  );
}

