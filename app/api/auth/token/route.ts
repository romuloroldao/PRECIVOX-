/**
 * POST /api/auth/token
 * Re-emite par Access + Refresh para sessão Precivox já autenticada.
 * (Legado: substituía emissão pós-NextAuth; login nativo já seta cookies em /api/auth/login.)
 */
import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { requireApiSession, isAuthResponse } from '@/lib/api-auth';
import { setAuthSessionCookies } from '@/lib/auth-session-cookies';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiSession(req);
    if (isAuthResponse(auth)) return auth;

    const dbUser = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { id: true, email: true, role: true, nome: true, tokenVersion: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    const tokens = await TokenManager.issueTokenPair({
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      nome: dbUser.nome,
      tokenVersion: dbUser.tokenVersion ?? 0,
    });

    const response = NextResponse.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt.toISOString(),
    });

    setAuthSessionCookies(response, tokens.accessToken, tokens.refreshToken);
    return response;
  } catch (error) {
    console.error('[API /auth/token] Erro:', error);
    return NextResponse.json({ error: 'Erro ao emitir tokens' }, { status: 500 });
  }
}
