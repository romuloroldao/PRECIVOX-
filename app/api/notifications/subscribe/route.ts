/**
 * POST /api/notifications/subscribe
 * Registra token FCM ou subscription Web Push (VAPID)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encodeWebPushToken, type WebPushSubscriptionPayload } from '@/lib/push-web';
import { isAuthResponse, requireApiSession } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await requireApiSession(request);
  if (isAuthResponse(session)) return session;

  const resolvedUserId = session.id;

  try {
    const body = await request.json();
    const { token, platform = 'web', subscription } = body as {
      token?: string;
      platform?: string;
      subscription?: WebPushSubscriptionPayload;
    };

    let storedToken = token?.trim();
    if (subscription?.endpoint && subscription.keys?.p256dh && subscription.keys?.auth) {
      storedToken = encodeWebPushToken(subscription);
    }

    if (!storedToken) {
      return NextResponse.json(
        { success: false, error: 'Informe token FCM ou subscription Web Push' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: resolvedUserId } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    const existing = await prisma.notificationSubscription.findUnique({
      where: { token: storedToken },
    });

    if (existing) {
      if (existing.userId !== resolvedUserId || !existing.enabled) {
        await prisma.notificationSubscription.update({
          where: { token: storedToken },
          data: { userId: resolvedUserId, platform, enabled: true },
        });
      }
    } else {
      await prisma.notificationSubscription.create({
        data: {
          userId: resolvedUserId,
          token: storedToken,
          platform,
          enabled: true,
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Token registrado com sucesso' });
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao registrar token' },
      { status: 500 }
    );
  }
}
