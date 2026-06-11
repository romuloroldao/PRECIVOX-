import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/admin-auth';
import { prisma } from '@/lib/prisma';
import { aceitarCestaOfertaAgregada } from '@/lib/oferta-agregada/cesta-mercado';
import { configParaResposta } from '@/lib/oferta-agregada/config';

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

    const body = await req.json().catch(() => ({}));
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

    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }
    if (!(await autorizarMercado(user, mercadoId))) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const resultado = await aceitarCestaOfertaAgregada(mercadoId, user.id);

    return NextResponse.json({
      success: true,
      data: {
        config: configParaResposta(resultado.config),
        cesta: resultado.cesta,
        mensagem: 'Cesta agregada aceita — demanda regional registrada para operação.',
      },
    });
  } catch (e) {
    console.error('[gestor/oferta-agregada/aceitar]', e);
    return NextResponse.json({ success: false, error: 'Erro ao aceitar cesta' }, { status: 500 });
  }
}
