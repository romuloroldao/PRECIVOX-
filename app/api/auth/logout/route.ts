import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TokenManager } from '@/lib/token-manager';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // 1) Invalidar tokens Auth v2 (tokenVersion + revogar refresh) para que Express e Next rejeitem o token
    const user = await TokenManager.validateSession({
      headers: request.headers,
      cookies: request.cookies,
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { tokenVersion: { increment: 1 } },
      });
      await TokenManager.revokeUserTokens(user.id);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });

    const cookiePrefix = process.env.NODE_ENV === 'production' ? '__Secure-' : '';
    const sessionCookieName = `${cookiePrefix}next-auth.session-token`;

    response.cookies.delete(sessionCookieName);
    response.cookies.delete('next-auth.csrf-token');
    response.cookies.delete('next-auth.callback-url');
    response.cookies.delete('__Secure-next-auth.session-token');
    response.cookies.delete('next-auth.session-token');

    response.cookies.delete(`${cookiePrefix}precivox-access-token`);
    response.cookies.delete('precivox-access-token');
    response.cookies.delete('__Secure-precivox-access-token');

    return response;
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
