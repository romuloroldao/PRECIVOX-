import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession, isAuthResponse } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { getCatalogoSaude } from '@/lib/catalogo-saude';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiSession(req, { roles: ['ADMIN', 'GESTOR'] });
    if (isAuthResponse(auth)) return auth;
    const user = auth;

    const mercadoIdParam = req.nextUrl.searchParams.get('mercadoId');
    let mercadoId = mercadoIdParam;

    if (user.role === 'GESTOR') {
      const mercado = await prisma.mercados.findFirst({
        where: { gestorId: user.id, ativo: true },
        select: { id: true },
      });
      if (!mercado) {
        return NextResponse.json({ success: false, error: 'Mercado não encontrado' }, { status: 404 });
      }
      mercadoId = mercado.id;
    }

    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }

    const saude = await getCatalogoSaude(mercadoId);
    return NextResponse.json({ success: true, data: saude });
  } catch (e) {
    console.error('[catalogo-saude]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
