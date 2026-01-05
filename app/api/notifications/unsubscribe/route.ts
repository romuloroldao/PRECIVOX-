/**
 * POST /api/notifications/unsubscribe
 * 
 * SQUAD B - Backend
 * 
 * Remove token FCM do usuário (desativa notificações)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token } = body;

    if (!userId || !token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'userId e token são obrigatórios',
        },
        { status: 400 }
      );
    }

    // Desativar ou remover subscription
    const subscription = await prisma.notificationSubscription.findUnique({
      where: { token },
    });

    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Token não encontrado',
        },
        { status: 404 }
      );
    }

    if (subscription.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Token não pertence a este usuário',
        },
        { status: 403 }
      );
    }

    // Remover subscription
    await prisma.notificationSubscription.delete({
      where: { token },
    });

    return NextResponse.json({
      success: true,
      message: 'Token removido com sucesso',
    });
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erro ao remover token',
      },
      { status: 500 }
    );
  }
}

