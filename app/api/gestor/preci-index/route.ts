import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession, isAuthResponse } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { calcularPreciIndexCesta, parseRegiaoPrecoParam } from '@/lib/preci-index-cesta';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiSession(req, { roles: ['ADMIN', 'GESTOR'] });
    if (isAuthResponse(auth)) return auth;
    const user = auth;

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

    const data = await calcularPreciIndexCesta(mercadoId, regiaoPreco, raioKm);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('[preci-index gestor GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
