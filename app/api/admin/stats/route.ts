import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    // Verificar autenticação via NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado - Apenas administradores' },
        { status: 403 }
      );
    }

    // Rate limiting por usuário
    const userId = (session.user as any).id || session.user.email;
    if (!checkRateLimit(userId || 'anonymous')) {
      console.warn(`Rate limit excedido para usuário: ${userId}`);
      return NextResponse.json(
        { error: 'Muitas requisições. Aguarde um momento.' },
        { status: 429 }
      );
    }

    // Buscar estatísticas com timeout
    const statsPromise = Promise.all([
      prisma.usuarios.count(),
      prisma.usuarios.count({ where: { role: 'CLIENTE' } }),
      prisma.usuarios.count({ where: { role: 'GESTOR' } }),
      prisma.usuarios.count({ where: { role: 'ADMIN' } })
    ]);

    const [total, clientes, gestores, admins] = await Promise.race([
      statsPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na consulta')), 5000)
      )
    ]) as [number, number, number, number];

    return NextResponse.json({
      total,
      clientes,
      gestores,
      admins
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    
    // Erro mais específico para timeout
    if (error instanceof Error && error.message === 'Timeout na consulta') {
      return NextResponse.json(
        { error: 'Timeout: banco de dados não respondeu a tempo' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
