import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/admin-auth';
import { prisma } from '@/lib/prisma';
import {
  criarPromoDirecionada,
  listarPromosGestor,
  segmentoLabel,
  togglePromoDirecionada,
} from '@/lib/monetizacao/promo-direcionada';
import { mercadoTemFeature } from '@/lib/monetizacao/saas-plano';
import type { PromoSegmento } from '@/lib/monetizacao/types';

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

    const temFeature =
      user.role === 'ADMIN' || (await mercadoTemFeature(mercadoId, 'promo_direcionada'));
    const promos = temFeature ? await listarPromosGestor(mercadoId) : [];

    return NextResponse.json({
      success: true,
      data: {
        promos: promos.map((p) => ({ ...p, segmentoLabel: segmentoLabel(p.segmento) })),
        temFeature,
        explicacao: temFeature
          ? 'Promos segmentadas por intenção, churn ou lista recente.'
          : 'Disponível a partir do plano Pro.',
      },
    });
  } catch (e) {
    console.error('[gestor/monetizacao/promo-direcionada GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    if (!['ADMIN', 'GESTOR'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 });
    }

    const body = (await req.json()) as {
      mercadoId?: string;
      titulo?: string;
      descontoPct?: number;
      segmento?: PromoSegmento;
      validoAte?: string;
      produtoId?: string;
      categoria?: string;
    };

    let mercadoId = body.mercadoId;
    if (user.role === 'GESTOR') {
      mercadoId = (await resolverMercadoId(user, null)) ?? undefined;
    }
    if (!mercadoId || !body.titulo || !body.validoAte) {
      return NextResponse.json(
        { success: false, error: 'mercadoId, titulo e validoAte obrigatórios' },
        { status: 400 }
      );
    }
    if (!(await autorizarMercado(user, mercadoId))) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }
    if (user.role === 'GESTOR' && !(await mercadoTemFeature(mercadoId, 'promo_direcionada'))) {
      return NextResponse.json(
        { success: false, error: 'Promo direcionada — plano Pro ou superior', upgrade: true },
        { status: 402 }
      );
    }

    const promo = await criarPromoDirecionada(mercadoId, {
      titulo: body.titulo,
      descontoPct: Number(body.descontoPct) || 10,
      segmento: body.segmento ?? 'intent_alta',
      validoAte: body.validoAte,
      produtoId: body.produtoId,
      categoria: body.categoria,
    });

    return NextResponse.json({ success: true, data: promo });
  } catch (e) {
    console.error('[gestor/monetizacao/promo-direcionada POST]', e);
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

    const body = (await req.json()) as { mercadoId?: string; promoId?: string; ativo?: boolean };
    let mercadoId = body.mercadoId;
    if (user.role === 'GESTOR') {
      mercadoId = (await resolverMercadoId(user, null)) ?? undefined;
    }
    if (!mercadoId || !body.promoId || typeof body.ativo !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Parâmetros inválidos' }, { status: 400 });
    }
    if (!(await autorizarMercado(user, mercadoId))) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const promo = await togglePromoDirecionada(mercadoId, body.promoId, body.ativo);
    if (!promo) {
      return NextResponse.json({ success: false, error: 'Promo não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: promo });
  } catch (e) {
    console.error('[gestor/monetizacao/promo-direcionada PATCH]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
