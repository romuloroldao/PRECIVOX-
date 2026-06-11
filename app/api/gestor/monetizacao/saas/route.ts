import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/admin-auth';
import { prisma } from '@/lib/prisma';
import { featureLabel, obterResumoSaasMercado } from '@/lib/monetizacao/saas-plano';

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

    const resumo = await obterResumoSaasMercado(mercadoId);

    return NextResponse.json({
      success: true,
      data: {
        ...resumo,
        featuresLabels: resumo.features.map(featureLabel),
        bloqueadasLabels: resumo.featuresBloqueadas.map(featureLabel),
      },
    });
  } catch (e) {
    console.error('[gestor/monetizacao/saas GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
