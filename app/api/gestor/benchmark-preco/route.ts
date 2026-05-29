import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getBenchmarkPrecoRegional,
  parseRegiaoPrecoParam,
} from '@/lib/benchmark-preco-regional';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; role?: string } | undefined;
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    if (user.role !== 'GESTOR' && user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 });
    }

    let mercadoId = req.nextUrl.searchParams.get('mercadoId');
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
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }

    const regiaoPreco = parseRegiaoPrecoParam(req.nextUrl.searchParams.get('regiaoPreco'));
    const raioKm = Math.min(200, Math.max(1, parseInt(req.nextUrl.searchParams.get('raioKm') || '25', 10)));
    const limite = parseInt(req.nextUrl.searchParams.get('limite') || '12', 10);

    const data = await getBenchmarkPrecoRegional(mercadoId, regiaoPreco, raioKm, limite);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('[benchmark-preco GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
