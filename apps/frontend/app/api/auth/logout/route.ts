import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-helpers';
import { TokenManager } from '@/lib/token-manager';
import { logAuthEvent } from '@/lib/auth-audit';
import { prisma } from '@/lib/prisma';

function getClientMeta(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip') ?? null;
  const userAgent = request.headers.get('user-agent') ?? null;
  return { ip, userAgent };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    const { ip, userAgent } = getClientMeta(request);

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { tokenVersion: { increment: 1 } },
      });
      await TokenManager.revokeUserTokens(user.id);
      await logAuthEvent({ userId: user.id, event: 'logout', ip, userAgent });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });

    const cookiePrefix = process.env.NODE_ENV === 'production' ? '__Secure-' : '';
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
