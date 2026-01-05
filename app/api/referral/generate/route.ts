/**
 * POST /api/referral/generate
 * 
 * SQUAD B - Backend
 * 
 * Gera código de referral único para o usuário
 * Se já existe, retorna o código existente
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Gera código de referral único
 */
function generateReferralCode(userId: string): string {
  // Usar parte do userId + timestamp + random
  const timestamp = Date.now().toString(36).slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const userIdPart = userId.slice(-4).toUpperCase();
  
  return `${userIdPart}-${timestamp}-${random}`;
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

    // Verificar se já existe código de referral
    const existingReferral = await prisma.referral.findFirst({
      where: {
        referrerId: userId,
        status: 'pending',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existingReferral) {
      return NextResponse.json({
        success: true,
        data: {
          code: existingReferral.code,
          url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/signup?ref=${existingReferral.code}`,
          createdAt: existingReferral.createdAt.toISOString(),
        },
      });
    }

    // Gerar novo código único
    let code: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      code = generateReferralCode(userId);
      
      const existing = await prisma.referral.findUnique({
        where: { code },
      });

      if (!existing) {
        isUnique = true;
      } else {
        attempts++;
      }
    }

    if (!isUnique) {
      return NextResponse.json(
        {
          success: false,
          error: 'Internal Server Error',
          message: 'Erro ao gerar código único. Tente novamente.',
        },
        { status: 500 }
      );
    }

    // Criar referral
    const referral = await prisma.referral.create({
      data: {
        code: code!,
        referrerId: userId,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        code: referral.code,
        url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/signup?ref=${referral.code}`,
        createdAt: referral.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating referral code:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erro ao gerar código de referral',
      },
      { status: 500 }
    );
  }
}

