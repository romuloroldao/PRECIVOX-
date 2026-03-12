/**
 * API Route: Emitir tokens (Access + Refresh)
 * 
 * Usado após login via NextAuth ou credenciais
 * Workers podem usar tokens sem depender de sessão web
 */

import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Verificar se usuário está autenticado via NextAuth
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Buscar usuário no banco para emissão de token (email case-insensitive)
    const dbUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: session.user.email,
          mode: 'insensitive',
        },
      },
      select: { id: true, email: true, role: true, nome: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 401 }
      );
    }

    const user: import('@/lib/token-manager').SessionUser = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      nome: dbUser.nome,
      tokenVersion: 0,
    };

    const tokens = await TokenManager.issueTokenPair(user);

    // Criar resposta com cookies
    const response = NextResponse.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt.toISOString(),
    });

    // Definir cookie do access token (opcional, para conveniência)
    const cookieName =
      process.env.NODE_ENV === 'production'
        ? '__Secure-precivox-access-token'
        : 'precivox-access-token';

    response.cookies.set(cookieName, tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 minutos (mesmo do access token)
    });

    return response;
  } catch (error) {
    console.error('[API /auth/token] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao emitir tokens' },
      { status: 500 }
    );
  }
}

