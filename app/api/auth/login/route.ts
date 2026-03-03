/**
 * BFF: POST /api/auth/login
 * Recebe { email, password }, chama Express /api/v1/auth/login e, em caso de sucesso,
 * emite tokens via TokenManager e retorna { token, user } (e accessToken, refreshToken, expiresAt).
 */

import { NextRequest, NextResponse } from 'next/server';
import { internalFetch } from '@/lib/internal-backend';
import { TokenManager } from '@/lib/token-manager';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const backendRes = await internalFetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || data.message || 'Erro ao fazer login',
        },
        { status: backendRes.status }
      );
    }

    if (!data.success || !data.data?.user) {
      return NextResponse.json(
        { success: false, error: 'Resposta inválida do backend' },
        { status: 502 }
      );
    }

    const backendUser = data.data.user as { id?: string; email?: string; name?: string; role?: string };
    const emailNorm = (backendUser.email || email).toString().toLowerCase().trim();

    const prismaUser = await prisma.user.findUnique({
      where: { email: emailNorm },
      select: { id: true, email: true, nome: true, role: true, tokenVersion: true },
    });

    if (!prismaUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuário não encontrado no sistema. Faça o cadastro primeiro.',
        },
        { status: 404 }
      );
    }

    const sessionUser = {
      id: prismaUser.id,
      email: prismaUser.email,
      role: prismaUser.role as 'ADMIN' | 'GESTOR' | 'CLIENTE',
      nome: prismaUser.nome ?? undefined,
      tokenVersion: prismaUser.tokenVersion ?? 0,
    };

    const tokens = await TokenManager.issueTokenPair(sessionUser);

    const user = {
      id: prismaUser.id,
      email: prismaUser.email,
      nome: prismaUser.nome ?? backendUser.name ?? '',
      role: prismaUser.role,
    };

    const response = NextResponse.json({
      success: true,
      token: tokens.accessToken,
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt.toISOString(),
    });

    const cookieName =
      process.env.NODE_ENV === 'production'
        ? '__Secure-precivox-access-token'
        : 'precivox-access-token';

    response.cookies.set(cookieName, tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });

    return response;
  } catch (error) {
    console.error('[API /auth/login] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar login' },
      { status: 500 }
    );
  }
}
