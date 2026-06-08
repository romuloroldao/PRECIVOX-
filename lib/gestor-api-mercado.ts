import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TokenManager, type SessionUser } from '@/lib/token-manager';

export type MercadoResolveResult =
  | { ok: true; mercadoId: string }
  | { ok: false; error: string; status: number };

/** Resolve mercado para rotas do painel gestor. */
export async function resolveMercadoIdForGestorApi(
  user: Pick<SessionUser, 'id' | 'role'>,
  mercadoIdParam: string | null
): Promise<MercadoResolveResult> {
  const param = mercadoIdParam?.trim();

  if (param) {
    const mercado = await prisma.mercados.findUnique({
      where: { id: param },
      select: { id: true, gestorId: true, ativo: true },
    });
    if (!mercado || !mercado.ativo) {
      return { ok: false, error: 'Mercado não encontrado', status: 404 };
    }
    if (user.role === 'GESTOR' && mercado.gestorId !== user.id) {
      return { ok: false, error: 'Acesso negado', status: 403 };
    }
    return { ok: true, mercadoId: mercado.id };
  }

  if (user.role === 'GESTOR') {
    const mercado = await prisma.mercados.findFirst({
      where: { gestorId: user.id, ativo: true },
      select: { id: true },
      orderBy: { dataCriacao: 'desc' },
    });
    if (!mercado) {
      return { ok: false, error: 'Mercado não encontrado', status: 404 };
    }
    return { ok: true, mercadoId: mercado.id };
  }

  return { ok: false, error: 'mercadoId obrigatório', status: 400 };
}

export type GestorApiAuthResult =
  | { ok: true; user: SessionUser; mercadoId: string }
  | { ok: false; response: NextResponse };

/** Auth alinhada a `/api/markets` — TokenManager (Auth V2 + fallback NextAuth). */
export async function requireGestorApiAccess(
  req: NextRequest,
  mercadoIdParam: string | null
): Promise<GestorApiAuthResult> {
  const user = await TokenManager.validateSession({
    headers: req.headers,
    cookies: req.cookies,
  });

  if (!user?.id || user.id === 'anonymous') {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 }),
    };
  }
  if (user.role !== 'GESTOR' && user.role !== 'ADMIN') {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 }),
    };
  }

  const resolved = await resolveMercadoIdForGestorApi(user, mercadoIdParam);
  if (!resolved.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      ),
    };
  }

  return { ok: true, user, mercadoId: resolved.mercadoId };
}

export async function requireApiUser(req: NextRequest): Promise<SessionUser | NextResponse> {
  const user = await TokenManager.validateSession({
    headers: req.headers,
    cookies: req.cookies,
  });

  if (!user?.id || user.id === 'anonymous') {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  return user;
}
