import { NextRequest, NextResponse } from 'next/server';

// CRÍTICO: Prisma requer runtime nodejs, não edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api/admin-auth';
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
    const accessCookie = request.cookies.get('__Secure-precivox-access-token') ? 'present' : 'missing';
    const sessionCookie = request.cookies.get('__Secure-next-auth.session-token') ? 'present' : 'missing';
    console.log('[admin/stats] cookies', { accessCookie, sessionCookie });

    // Auth: 1) TokenManager (cookie/header), 2) fallback NextAuth (getToken + Prisma)
    let user = await TokenManager.validateRole('ADMIN', {
      headers: request.headers,
      cookies: request.cookies,
    });
    if (!user) {
      const adminResult = await requireAdmin(request);
      console.log('[admin/stats] requireAdmin result', { hasSession: adminResult.hasSession, userEmail: adminResult.user?.email });
      const adminUser = adminResult.user;
      user = adminUser
        ? { id: adminUser.id, email: adminUser.email, role: adminUser.role, nome: adminUser.nome ?? undefined }
        : null;
    }

    if (!user) {
      console.warn('[admin/stats] unauthorized after TokenManager + requireAdmin');
      return NextResponse.json(
        { error: 'Não autenticado', code: 'UNAUTHORIZED' },
        { status: 401 },
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
        products,
      },
    });
  } catch (error) {
    console.error('[API /admin/stats] Erro ao buscar estatísticas:', error);
    console.error('[API /admin/stats] Stack trace:', error instanceof Error ? error.stack : 'No stack');
    
    // Erro mais específico para timeout
    if (error instanceof Error && error.message === 'Timeout na consulta') {
      return NextResponse.json(
        { error: 'Timeout: banco de dados não respondeu a tempo' },
        { status: 504 }
      );
    }
    
    // Erro de conexão com banco
    if (
      error instanceof Error &&
      (error.message.includes("Can't reach database") ||
        error.message.includes('P1001') ||
        error.message.includes('connection'))
    ) {
      return NextResponse.json(
        { error: 'Erro de conexão com banco de dados', code: 'DATABASE_ERROR' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : undefined,
      },
      { status: 500 },
    );
  }
}

