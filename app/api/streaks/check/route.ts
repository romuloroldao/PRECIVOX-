/**
 * POST /api/streaks/check
 * 
 * SQUAD B - Backend
 * 
 * Verifica e atualiza streak (dias consecutivos) do usuário
 * Chamado após login
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Calcula diferença em dias entre duas datas
 */
function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / oneDay);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'userId é obrigatório',
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

      return NextResponse.json({
        success: true,
        data: {
          streak: 1,
          isNew: true,
          longestStreak: 1,
        },
      });
    }

    // Calcular dias desde último login
    const lastLogin = new Date(streak.lastLogin);
    lastLogin.setHours(0, 0, 0, 0);
    const diffDays = daysBetween(lastLogin, today);

    // Atualizar streak
    if (diffDays === 0) {
      // Já logou hoje, não fazer nada
      return NextResponse.json({
        success: true,
        data: {
          streak: streak.currentStreak,
          isNew: false,
          longestStreak: streak.longestStreak,
        },
      });
    } else if (diffDays === 1) {
      // Login consecutivo, incrementar
      const newStreak = streak.currentStreak + 1;
      const newLongest = Math.max(newStreak, streak.longestStreak);

      const updated = await prisma.userStreak.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastLogin: today,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          streak: newStreak,
          isNew: false,
          isNewRecord: newStreak > streak.longestStreak,
          longestStreak: newLongest,
        },
      });
    } else {
      // Quebrou streak (diffDays > 1), resetar
      const updated = await prisma.userStreak.update({
        where: { userId },
        data: {
          currentStreak: 1,
          lastLogin: today,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          streak: 1,
          broken: true,
          longestStreak: streak.longestStreak,
          previousStreak: streak.currentStreak,
        },
      });
    }
  } catch (error) {
    console.error('Error checking streak:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erro ao verificar streak',
      },
      { status: 500 }
    );
  }
}

