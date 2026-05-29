import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/admin-auth';
import { prisma } from '@/lib/prisma';
import { aprovarPromocaoAssistida } from '@/lib/pricing-assistido';

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

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    if (!['ADMIN', 'GESTOR'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 });
    }

    const body = await req.json();
    const estoqueId = String(body.estoqueId ?? '').trim();
    let mercadoId = body.mercadoId ? String(body.mercadoId) : undefined;

    if (user.role === 'GESTOR') {
      const m = await prisma.mercados.findFirst({
        where: { gestorId: user.id, ativo: true },
        select: { id: true },
      });
      if (!m) {
        return NextResponse.json({ success: false, error: 'Mercado não encontrado' }, { status: 404 });
      }
      mercadoId = m.id;
    }

    if (!mercadoId || !estoqueId) {
      return NextResponse.json(
        { success: false, error: 'mercadoId e estoqueId são obrigatórios' },
        { status: 400 }
      );
    }
    if (!(await autorizarMercado(user, mercadoId))) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const descontoPct =
      body.descontoPct != null ? Number(body.descontoPct) : undefined;

    const resultado = await aprovarPromocaoAssistida({
      mercadoId,
      estoqueId,
      userId: user.id,
      descontoPct: Number.isFinite(descontoPct) ? descontoPct : undefined,
    });

    return NextResponse.json({ success: true, data: resultado });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao aprovar promoção';
    console.error('[pricing-assistido/aprovar]', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
