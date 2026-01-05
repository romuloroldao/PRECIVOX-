import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

import { verifyToken } from '@/lib/jwt';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';


export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Por enquanto, retornar logs simulados
    // Em uma implementação real, você teria uma tabela de logs no banco
    const mockLogs = [
      {
        id: '1',
        level: 'INFO',
        message: 'Usuário admin@precivox.com fez login com sucesso',
        timestamp: new Date().toISOString(),
        source: 'auth',
        userId: payload.id,
        userEmail: payload.email
      },
      {
        id: '2',
        level: 'INFO',
        message: 'Novo usuário cliente@exemplo.com registrado',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        source: 'auth',
        userEmail: 'cliente@exemplo.com'
      },
      {
        id: '3',
        level: 'WARN',
        message: 'Tentativa de login falhada para email@invalido.com',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        source: 'auth',
        userEmail: 'email@invalido.com'
      },
      {
        id: '4',
        level: 'ERROR',
        message: 'Erro ao conectar com banco de dados',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        source: 'database'
      },
      {
        id: '5',
        level: 'INFO',
        message: 'Sistema iniciado com sucesso',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        source: 'system'
      }
    ];

    return NextResponse.json(mockLogs);

  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
