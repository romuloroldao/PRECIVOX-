/**
 * GET /api/referral/stats
 * 
 * SQUAD B - Backend
 * 
 * Retorna estatísticas de referral do usuário
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCached } from '@/lib/redis';
import { getBaseUrl } from '@/lib/email';
import { isAuthResponse, requireApiSession } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

async function fetchReferralStats(userId: string) {
  // Buscar todos os referrals do usuário
  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
    include: {
      referee: {
        select: {
          id: true,
          nome: true,
          email: true,
          dataCriacao: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Calcular estatísticas
  const totalReferrals = referrals.length;
  const completedReferrals = referrals.filter((r) => r.status === 'completed').length;
  const pendingReferrals = referrals.filter((r) => r.status === 'pending').length;

  // Buscar código ativo (mais recente pendente)
  const activeCode = referrals.find((r) => r.status === 'pending');

  // Calcular conversão
  const conversionRate =
    totalReferrals > 0 ? Math.round((completedReferrals / totalReferrals) * 100) : 0;

  return {
    totalReferrals,
    completedReferrals,
    pendingReferrals,
    conversionRate,
    activeCode: activeCode
      ? {
          code: activeCode.code,
          url: `${getBaseUrl()}/signup?ref=${activeCode.code}`,
          createdAt: activeCode.createdAt.toISOString(),
        }
      : null,
    recentReferrals: referrals
      .filter((r) => r.status === 'completed')
      .slice(0, 10)
      .map((r) => ({
        id: r.id,
        code: r.code,
        referee: r.referee
          ? {
              id: r.referee.id,
              nome: r.referee.nome,
              email: r.referee.email,
            }
          : null,
        completedAt: r.completedAt?.toISOString(),
      })),
  };
}

export async function GET(request: NextRequest) {
  const session = await requireApiSession(request);
  if (isAuthResponse(session)) return session;

  const userId = session.id;

  try {
    // Buscar do cache Redis (5 minutos) ou do banco
    const cacheKey = `referral:stats:${userId}`;
    const data = await getCached(
      cacheKey,
      () => fetchReferralStats(userId),
      300 // 5 minutos
    );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erro ao buscar estatísticas de referral',
      },
      { status: 500 }
    );
  }
}

