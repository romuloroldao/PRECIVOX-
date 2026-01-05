/**
 * POST /api/referral/track
 * 
 * SQUAD B - Backend
 * 
 * Rastreia quando um novo usuário se registra usando código de referral
 * Recompensa referrer e referee
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { autoUnlockBadgesServer } from '@/lib/gamification-server';
import { invalidate } from '@/lib/redis';

export const dynamic = 'force-dynamic';

/**
 * Recompensas configuráveis
 */
const REFERRER_REWARDS = {
  points: 100, // Pontos para o referrer
  badgeRequirement: 1, // Badge desbloqueado ao fazer 1 referral
};

const REFEREE_REWARDS = {
  points: 50, // Pontos para o referee (novo usuário)
  bonusMessage: 'Bem-vindo! Você ganhou pontos por usar um código de referral.',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, refereeId } = body;

    if (!code || !refereeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'code e refereeId são obrigatórios',
        },
        { status: 400 }
      );
    }

    // Verificar se código existe e está pendente
    const referral = await prisma.referral.findUnique({
      where: { code },
      include: {
        referrer: true,
      },
    });

    if (!referral) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Código de referral inválido',
        },
        { status: 404 }
      );
    }

    if (referral.status === 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Este código de referral já foi usado',
        },
        { status: 400 }
      );
    }

    if (referral.referrerId === refereeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Você não pode usar seu próprio código de referral',
        },
        { status: 400 }
      );
    }

    // Verificar se referee existe
    const referee = await prisma.user.findUnique({
      where: { id: refereeId },
    });

    if (!referee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Usuário não encontrado',
        },
        { status: 404 }
      );
    }

    // Atualizar referral como completado
    const updatedReferral = await prisma.referral.update({
      where: { id: referral.id },
      data: {
        refereeId,
        status: 'completed',
        completedAt: new Date(),
      },
    });

    // Recompensar referrer
    try {
      // Desbloquear badge de referral
      await autoUnlockBadgesServer(referral.referrerId, 'referral_made');
      
      // Invalidar cache de badges do referrer
      await invalidate(`badges:${referral.referrerId}`);

      // Enviar notificação de referral completado
      try {
        const { notifyReferralCompleted } = await import('@/lib/notifications');
        await notifyReferralCompleted(referral.referrerId, referee.nome || referee.email);
      } catch (error) {
        console.error('Error sending referral notification:', error);
        // Continuar mesmo se notificação falhar
      }
    } catch (error) {
      console.error('Error rewarding referrer:', error);
      // Continuar mesmo se gamificação falhar
    }

    // Recompensar referee (novo usuário)
    // Nota: Pontos serão adicionados via gamificação quando implementado
    // Por enquanto, apenas registramos o bonus

    return NextResponse.json({
      success: true,
      data: {
        referral: {
          id: updatedReferral.id,
          code: updatedReferral.code,
          status: updatedReferral.status,
          completedAt: updatedReferral.completedAt?.toISOString(),
        },
        rewards: {
          referrer: {
            points: REFERRER_REWARDS.points,
            badgeUnlocked: true,
          },
          referee: {
            points: REFEREE_REWARDS.points,
            message: REFEREE_REWARDS.bonusMessage,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error tracking referral:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erro ao rastrear referral',
      },
      { status: 500 }
    );
  }
}

