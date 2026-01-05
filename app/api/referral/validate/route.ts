/**
 * GET /api/referral/validate
 * 
 * SQUAD B - Backend
 * 
 * Valida se um código de referral é válido e retorna informações
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'code é obrigatório',
        },
        { status: 400 }
      );
    }

    // Buscar referral
    const referral = await prisma.referral.findUnique({
      where: { code },
      include: {
        referrer: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
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
          data: {
            valid: false,
            used: true,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        used: false,
        code: referral.code,
        referrer: {
          id: referral.referrer.id,
          nome: referral.referrer.nome,
        },
        createdAt: referral.createdAt.toISOString(),
        rewards: {
          referee: {
            points: 50,
            message: 'Você ganhará 50 pontos ao se cadastrar!',
          },
        },
      },
    });
  } catch (error) {
    console.error('Error validating referral code:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erro ao validar código de referral',
      },
      { status: 500 }
    );
  }
}

