/**
 * GET /api/gamification/badges
 * 
 * SQUAD B - Backend
 * 
 * Lista todos os badges disponíveis e progresso do usuário
 * Cache: 1 hora
 * Rate Limit: 60 req/min
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCached } from '@/lib/redis';

export const dynamic = 'force-dynamic';

async function fetchBadgesFromDB(userId?: string) {
  // Buscar todos os badges
  const allBadges = await prisma.badges.findMany({
    orderBy: [
      { category: 'asc' },
      { points: 'asc' },
    ],
  });

  // Se userId fornecido, buscar progresso
  let userBadges: any[] = [];
  if (userId) {
    userBadges = await prisma.user_badges.findMany({
      where: { userId },
      include: {
        badges: true,
      },
    });
  }

  // Criar mapa de badges desbloqueados
  const unlockedMap = new Map(
    userBadges.map((ub) => [ub.badgeId, {
      unlocked: true,
      unlockedAt: ub.unlockedAt,
      progress: ub.progress,
    }])
  );

  // Agrupar por categoria
  const badgesByCategory = allBadges.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }

    const userProgress = unlockedMap.get(badge.id);
    
    acc[badge.category].push({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      points: badge.points,
      category: badge.category,
      unlocked: !!userProgress,
      unlockedAt: userProgress?.unlockedAt || null,
      progress: userProgress?.progress || 0,
      requirement: {
        type: badge.requirementType,
        value: badge.requirementValue,
      },
    });

    return acc;
  }, {} as Record<string, any[]>);

  // Calcular estatísticas do usuário
  const stats = userId ? {
    totalBadges: allBadges.length,
    unlockedBadges: userBadges.length,
    totalPoints: userBadges.reduce((sum, ub) => sum + ub.badges.points, 0),
    completionPercentage: Math.round((userBadges.length / allBadges.length) * 100),
  } : null;

  return {
    badges: badgesByCategory,
    stats,
    totalBadges: allBadges.length,
    unlockedBadges: userBadges.length,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;

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

    // Buscar do cache Redis (1 hora) ou do banco
    const cacheKey = `badges:${userId}`;
    const data = await getCached(
      cacheKey,
      () => fetchBadgesFromDB(userId),
      3600 // 1 hora
    );

    const response = {
      success: true,
      data,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'X-Cache-Key': cacheKey,
      },
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erro ao buscar badges',
      },
      { status: 500 }
    );
  }
}
