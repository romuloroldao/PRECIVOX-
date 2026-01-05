import { NextRequest, NextResponse } from 'next/server';

// Forçar renderização dinâmica
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { prisma } from '@/lib/prisma';
import { TokenManager } from '@/lib/token-manager';

// Rate limiting simples em memória
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // máximo de requisições
const RATE_WINDOW = 60000; // 1 minuto

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const userLimit = requestCounts.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação usando TokenManager
    // Passar request para validar token do header Authorization
    const user = await TokenManager.validateRole('ADMIN', {
      headers: request.headers,
      cookies: request.cookies,
    });
    
    // Debug: Log para verificar sessão
    console.log('[API /admin/stats] Session check:', {
      hasUser: !!user,
      userRole: user?.role,
      userId: user?.id,
      hasAuthHeader: !!request.headers.get('authorization'),
      cookies: request.cookies.getAll().map(c => c.name),
    });
    
    if (!user) {
      // Verificar se é problema de autenticação ou permissão
      const sessionUser = await TokenManager.validateSession({
        headers: request.headers,
        cookies: request.cookies,
      });
      if (!sessionUser) {
        return NextResponse.json(
          { error: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Rate limiting por usuário
    const userId = user.id || user.email;
    if (!checkRateLimit(userId || 'anonymous')) {
      console.warn(`Rate limit excedido para usuário: ${userId}`);
      return NextResponse.json(
        { error: 'Muitas requisições. Aguarde um momento.' },
        { status: 429 }
      );
    }

    // Buscar estatísticas com timeout
    const statsPromise = Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CLIENTE' } }),
      prisma.user.count({ where: { role: 'GESTOR' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.mercados.count(),
      prisma.produtos.count()
    ]);

    const [total, clientes, gestores, admins, markets, products] = await Promise.race([
      statsPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na consulta')), 5000)
      )
    ]) as [number, number, number, number, number, number];

    return NextResponse.json({
      success: true,
      data: {
        total,
        clientes,
        gestores,
        admins,
        markets,
        products
      }
    });

  } catch (error) {
    console.error('[API /admin/stats] Erro ao buscar estatísticas:', error);
    
    // Erro mais específico para timeout
    if (error instanceof Error && error.message === 'Timeout na consulta') {
      return NextResponse.json(
        { error: 'Timeout: banco de dados não respondeu a tempo' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
