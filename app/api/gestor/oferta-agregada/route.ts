import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/admin-auth';
import { prisma } from '@/lib/prisma';
import { configParaResposta, obterConfigOfertaAgregada, salvarConfigOfertaAgregada } from '@/lib/oferta-agregada/config';
import { montarCestaOfertaAgregada } from '@/lib/oferta-agregada/cesta-mercado';
import type { OfertaAgregadaConfig } from '@/lib/oferta-agregada/types';

export const dynamic = 'force-dynamic';

async function autorizarMercado(
  user: { id: string; role: string },
  mercadoId: string
): Promise<boolean> {
  const mercado = await prisma.mercados.findUnique({
    where: { id: mercadoId },
    select: { gestorId: true },
  });
  if (!mercado) return false;
  if (user.role === 'ADMIN') return true;
  return user.role === 'GESTOR' && mercado.gestorId === user.id;
}

async function resolverMercadoId(user: { id: string; role: string }, param: string | null) {
  if (user.role === 'GESTOR') {
    const m = await prisma.mercados.findFirst({
      where: { gestorId: user.id, ativo: true },
      select: { id: true },
    });
    return m?.id ?? null;
  }
  return param;
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    if (!['ADMIN', 'GESTOR'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 });
    }

    const mercadoId = await resolverMercadoId(user, req.nextUrl.searchParams.get('mercadoId'));
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }
    if (!(await autorizarMercado(user, mercadoId))) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const [config, cesta] = await Promise.all([
      obterConfigOfertaAgregada(mercadoId),
      montarCestaOfertaAgregada(mercadoId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        config: configParaResposta(config),
        cesta,
      },
    });
  } catch (e) {
    console.error('[gestor/oferta-agregada GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    if (!['ADMIN', 'GESTOR'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 });
    }

    const body = (await req.json()) as { mercadoId?: string } & Partial<OfertaAgregadaConfig>;
    let mercadoId = body.mercadoId;
    if (user.role === 'GESTOR') {
      const m = await prisma.mercados.findFirst({
        where: { gestorId: user.id, ativo: true },
        select: { id: true },
      });
      mercadoId = m?.id;
    }
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }
    if (!(await autorizarMercado(user, mercadoId))) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const { mercadoId: _m, ultimoAceite: _u, aceiteEm: _a, ...patch } = body;
    const config = await salvarConfigOfertaAgregada(mercadoId, patch);

    return NextResponse.json({ success: true, data: configParaResposta(config) });
  } catch (e) {
    console.error('[gestor/oferta-agregada PATCH]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
