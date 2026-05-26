import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCatalogoSaude } from '@/lib/catalogo-saude';

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
