import { NextRequest, NextResponse } from 'next/server';
import { isAuthResponse, requireApiSession } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(request, { roles: ['ADMIN'] });
  if (isAuthResponse(auth)) return auth;

  try {
    const mockLogs = [
      {
        id: '1',
        level: 'INFO',
        message: 'Usuário admin@precivox.com fez login com sucesso',
        timestamp: new Date().toISOString(),
        source: 'auth',
        userId: auth.id,
        userEmail: auth.email,
      },
      {
        id: '2',
        level: 'INFO',
        message: 'Novo usuário cliente@exemplo.com registrado',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        source: 'auth',
        userEmail: 'cliente@exemplo.com',
      },
      {
        id: '3',
        level: 'WARN',
        message: 'Tentativa de login falhada para email@invalido.com',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        source: 'auth',
        userEmail: 'email@invalido.com',
      },
      {
        id: '4',
        level: 'ERROR',
        message: 'Erro ao conectar com banco de dados',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        source: 'database',
      },
      {
        id: '5',
        level: 'INFO',
        message: 'Sistema iniciado com sucesso',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        source: 'system',
      },
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
