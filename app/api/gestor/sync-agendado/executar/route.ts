import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/admin-auth';
import { prisma } from '@/lib/prisma';
import { executarSyncMercado } from '@/lib/sync-agendado';

export const dynamic = 'force-dynamic';

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
    const mercadoId = String(body.mercadoId ?? '');
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }

    const mercado = await prisma.mercados.findUnique({
      where: { id: mercadoId },
      select: { gestorId: true },
    });
    if (!mercado) {
      return NextResponse.json({ success: false, error: 'Mercado não encontrado' }, { status: 404 });
    }
    if (user.role === 'GESTOR' && mercado.gestorId !== user.id) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const resultado = await executarSyncMercado(mercadoId, true);
    return NextResponse.json({
      success: resultado.ok,
      data: resultado,
    });
  } catch (e) {
    console.error('[sync-agendado executar]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
