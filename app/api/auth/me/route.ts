import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession, isAuthResponse } from '@/lib/api-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 * Retorna o usuário autenticado (via cookie de sessão ou Authorization: Bearer).
 * Usado por clientes que precisam reidratar o estado de auth.
 */
export async function GET(request: NextRequest) {
  const session = await requireApiSession(request);
  if (isAuthResponse(session)) return session;

  return NextResponse.json({
    success: true,
    user: {
      id: session.id,
      email: session.email,
      nome: session.nome ?? '',
      role: session.role,
    },
  });
}
