/**
 * POST /api/notifications/send
 * 
 * SQUAD B - Backend
 * 
 * API administrativa para enviar notificações push
 * (Usar preferencialmente as funções do /lib/notifications.ts)
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendNotificationToUser } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, title, body: message, data } = body;

    if (!userId || !title || !message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'userId, title e body são obrigatórios',
        },
        { status: 400 }
      );
    }

    const result = await sendNotificationToUser(
      userId,
      type || 'BADGE_UNLOCKED',
      title,
      message,
      data
    );

    return NextResponse.json({
      success: result.success,
      sent: result.sent,
      message: result.success
        ? `Notificação enviada para ${result.sent} dispositivo(s)`
        : 'Nenhuma notificação enviada',
    });
  } catch (error) {
    console.error('Error sending notification:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erro ao enviar notificação',
      },
      { status: 500 }
    );
  }
}

