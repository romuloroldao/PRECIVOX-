import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

    // Buscar usuários recentes (últimos 10)
    const recentUsers = await prisma.usuarios.findMany({
      take: 10,
      orderBy: { data_criacao: 'desc' },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        data_criacao: true
      }
    });

    return NextResponse.json(recentUsers);

  } catch (error) {
    console.error('Erro ao buscar usuários recentes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
