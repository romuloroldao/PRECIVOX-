/**
 * POST /api/notifications/subscribe
 * 
 * SQUAD B - Backend
 * 
 * Registra token FCM do usuário para receber notificações push
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token, platform = 'web' } = body;

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

    // Verificar se token já existe
    const existing = await prisma.notificationSubscription.findUnique({
      where: { token },
    });

    if (existing) {
      // Atualizar se for de outro usuário ou atualizar plataforma
      if (existing.userId !== userId) {
        await prisma.notificationSubscription.update({
          where: { token },
          data: {
            userId,
            platform,
            enabled: true,
          },
        });
      } else {
        // Apenas atualizar plataforma se necessário
        if (existing.platform !== platform) {
          await prisma.notificationSubscription.update({
            where: { token },
            data: { platform },
          });
        }
      }
    } else {
      // Criar nova subscription
      await prisma.notificationSubscription.create({
        data: {
          userId,
          token,
          platform,
          enabled: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Token registrado com sucesso',
    });
  } catch (error) {
    console.error('Error subscribing to notifications:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erro ao registrar token',
      },
      { status: 500 }
    );
  }
}

