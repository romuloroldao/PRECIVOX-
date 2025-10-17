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

    // Buscar estatísticas
    const [total, clientes, gestores, admins] = await Promise.all([
      prisma.usuarios.count(),
      prisma.usuarios.count({ where: { role: 'CLIENTE' } }),
      prisma.usuarios.count({ where: { role: 'GESTOR' } }),
      prisma.usuarios.count({ where: { role: 'ADMIN' } })
    ]);

    return NextResponse.json({
      total,
      clientes,
      gestores,
      admins
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
