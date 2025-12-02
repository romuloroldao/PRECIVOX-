/**
 * Push Notification Service - Notificações push para alertas
 */

import * as webpush from 'web-push';
import { logger } from '../ai/utils/logger';

export interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export interface NotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: any;
    actions?: Array<{
        action: string;
        title: string;
        icon?: string;
    }>;
    requireInteraction?: boolean;
    tag?: string;
}

export class PushNotificationService {
    private vapidKeys: {
        publicKey: string;
        privateKey: string;
    } | null = null;

    constructor() {
        // Configurar VAPID keys (deve estar em variáveis de ambiente)
        const publicKey = process.env.VAPID_PUBLIC_KEY;
        const privateKey = process.env.VAPID_PRIVATE_KEY;

        if (publicKey && privateKey) {
            this.vapidKeys = { publicKey, privateKey };
            webpush.setVapidDetails(
                'mailto:contato@precivox.com',
                publicKey,
                privateKey
            );
        } else {
            logger.warn('PushNotificationService', 'VAPID keys não configuradas');
        }
    }

    /**
     * Registra subscription de push para um usuário
     */
    async registerSubscription(userId: string, subscription: PushSubscription): Promise<void> {
        try {
            const { prisma } = await import('../ai/lib/prisma-compat');
            
            // Verificar se já existe subscription para este endpoint
            const existing = await prisma.push_subscriptions.findFirst({
                where: {
                    userId,
                    endpoint: subscription.endpoint
                }
            });

            if (existing) {
                // Atualizar subscription existente
                await prisma.push_subscriptions.update({
                    where: { id: existing.id },
                    data: {
                        p256dh: subscription.keys.p256dh,
                        auth: subscription.keys.auth,
                        active: true,
                        updatedAt: new Date()
                    }
                });
            } else {
                // Criar nova subscription
                await prisma.push_subscriptions.create({
                    data: {
                        id: `push-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        userId,
                        endpoint: subscription.endpoint,
                        p256dh: subscription.keys.p256dh,
                        auth: subscription.keys.auth,
                        active: true
                    }
                });
            }

            logger.info('PushNotificationService', 'Subscription registrada', { userId });
        } catch (error: any) {
            logger.error('PushNotificationService', 'Erro ao registrar subscription', {
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Envia notificação push para um usuário
     */
    async sendNotification(userId: string, payload: NotificationPayload): Promise<void> {
        try {
            const { prisma } = await import('../ai/lib/prisma-compat');
            
            // Buscar subscriptions ativas do usuário
            const subscriptions = await prisma.push_subscriptions.findMany({
                where: {
                    userId,
                    active: true,
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: new Date() } }
                    ]
                }
            });

            if (subscriptions.length === 0) {
                logger.warn('PushNotificationService', 'Usuário sem subscription ativa', { userId });
                return;
            }

            // Enviar para todas as subscriptions ativas
            const results = await Promise.allSettled(
                subscriptions.map(sub => this.sendToSubscription({
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                }, payload))
            );

            const successCount = results.filter(r => r.status === 'fulfilled').length;
            const failedCount = results.filter(r => r.status === 'rejected').length;

            // Desativar subscriptions que falharam (expiradas)
            for (let i = 0; i < results.length; i++) {
                if (results[i].status === 'rejected') {
                    const error = (results[i] as PromiseRejectedResult).reason;
                    if (error.statusCode === 410) {
                        // Subscription expirada
                        await prisma.push_subscriptions.update({
                            where: { id: subscriptions[i].id },
                            data: { active: false }
                        });
                    }
                }
            }
            
            logger.info('PushNotificationService', 'Notificação enviada', {
                userId,
                title: payload.title,
                successCount,
                failedCount
            });
        } catch (error: any) {
            logger.error('PushNotificationService', 'Erro ao enviar notificação', {
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Envia notificação para múltiplos usuários
     */
    async sendBulkNotification(userIds: string[], payload: NotificationPayload): Promise<{
        sent: number;
        failed: number;
    }> {
        let sent = 0;
        let failed = 0;

        const promises = userIds.map(async (userId) => {
            try {
                await this.sendNotification(userId, payload);
                sent++;
            } catch (error) {
                failed++;
            }
        });

        await Promise.allSettled(promises);

        logger.info('PushNotificationService', 'Notificações em massa enviadas', {
            total: userIds.length,
            sent,
            failed
        });

        return { sent, failed };
    }

    /**
     * Envia notificação de alerta de IA
     */
    async sendAlertNotification(
        userId: string,
        alert: {
            tipo: string;
            titulo: string;
            descricao: string;
            prioridade: string;
            produtoId?: string;
            linkAcao?: string;
        }
    ): Promise<void> {
        const payload: NotificationPayload = {
            title: `🚨 ${alert.titulo}`,
            body: alert.descricao,
            icon: '/icons/alert.png',
            badge: '/icons/badge.png',
            data: {
                tipo: alert.tipo,
                produtoId: alert.produtoId,
                linkAcao: alert.linkAcao
            },
            actions: alert.linkAcao ? [
                {
                    action: 'view',
                    title: 'Ver Detalhes',
                    icon: '/icons/view.png'
                }
            ] : undefined,
            requireInteraction: alert.prioridade === 'ALTA',
            tag: `alert-${alert.tipo}`
        };

        await this.sendNotification(userId, payload);
    }

    /**
     * Envia notificação para subscription específica
     */
    private async sendToSubscription(
        subscription: PushSubscription,
        payload: NotificationPayload
    ): Promise<void> {
        if (!this.vapidKeys) {
            throw new Error('VAPID keys não configuradas');
        }

        try {
            await webpush.sendNotification(
                subscription,
                JSON.stringify(payload)
            );
        } catch (error: any) {
            if (error.statusCode === 410) {
                // Subscription expirada ou inválida
                logger.warn('PushNotificationService', 'Subscription inválida', {
                    endpoint: subscription.endpoint
                });
                // TODO: Remover subscription do banco
            }
            throw error;
        }
    }

    /**
     * Gera VAPID keys (usar apenas uma vez)
     */
    static generateVAPIDKeys(): { publicKey: string; privateKey: string } {
        const vapidKeys = webpush.generateVAPIDKeys();
        return {
            publicKey: vapidKeys.publicKey,
            privateKey: vapidKeys.privateKey
        };
    }
}

