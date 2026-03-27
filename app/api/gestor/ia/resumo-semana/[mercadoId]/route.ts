import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { prisma } from '@/lib/prisma';
import { buildResumoSemanalGestor } from '@/lib/ai/resumo-semana-gestor';
import { parseRegiaoPrecoParam, resolveRegiaoPrecoParaMercado } from '@/lib/ai/conversao-metrics';

export const dynamic = 'force-dynamic';

async function assertGestorMercado(userId: string, role: string, mercadoId: string): Promise<boolean> {
  if (role === 'ADMIN') {
    const m = await prisma.mercados.findFirst({ where: { id: mercadoId }, select: { id: true } });
    return Boolean(m);
  }
  if (role !== 'GESTOR') return false;
  const m = await prisma.mercados.findFirst({
    where: { id: mercadoId, gestorId: userId },
    select: { id: true },
  });
  return Boolean(m);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { mercadoId: string } }
) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const mercadoId = params.mercadoId;
    const ok = await assertGestorMercado(user.id, user.role, mercadoId);
    if (!ok) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const sp = new URL(req.url).searchParams;
    const dias = Math.min(90, Math.max(7, parseInt(sp.get('dias') || '30', 10)));
    const regiaoPreco = parseRegiaoPrecoParam(sp.get('regiaoPreco'));
    const raioKm = Math.min(200, Math.max(1, parseInt(sp.get('raioKm') || '25', 10)));

    const mercado = await prisma.mercados.findFirst({
      where: { id: mercadoId },
      select: { nome: true },
    });

    const ctxRegiao = await resolveRegiaoPrecoParaMercado(mercadoId, regiaoPreco);
    const data = await buildResumoSemanalGestor(mercadoId, dias, mercado?.nome ?? null, ctxRegiao, raioKm);

    return NextResponse.json({
      success: true,
      mercadoId,
      mercadoNome: mercado?.nome ?? null,
      regiaoPreco: {
        pedido: ctxRegiao.pedido,
        efetivo: ctxRegiao.efetivo,
        fallbackDeCidadeParaAmpla: ctxRegiao.fallbackDeCidadeParaAmpla,
        raioKm,
      },
      ...data,
    });
  } catch (e) {
    console.error('[GET /api/gestor/ia/resumo-semana]', e);
    return NextResponse.json(
      { error: 'Erro ao gerar resumo', details: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    );
  }
}
