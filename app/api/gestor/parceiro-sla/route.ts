import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/admin-auth';
import { prisma } from '@/lib/prisma';
import {
  aceitarContratoParceiro,
  CONTRATO_RESUMO_HTML,
  CONTRATO_VERSAO_ATUAL,
  obterParceiroSla,
  salvarTierParceiro,
  TIER_DEFINICOES,
  type ParceiroTier,
} from '@/lib/parceiro-sla';

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

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    if (!['ADMIN', 'GESTOR'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 });
    }

    const mercadoId = req.nextUrl.searchParams.get('mercadoId');
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }
    if (!(await autorizarMercado(user, mercadoId))) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const resumo = await obterParceiroSla(mercadoId);
    return NextResponse.json({
      success: true,
      data: {
        ...resumo,
        tiers: Object.values(TIER_DEFINICOES),
        contratoVersaoAtual: CONTRATO_VERSAO_ATUAL,
        contratoResumoHtml: CONTRATO_RESUMO_HTML,
      },
    });
  } catch (e) {
    console.error('[parceiro-sla GET]', e);
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

    const body = await req.json();
    const mercadoId = body.mercadoId as string | undefined;
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }
    if (!(await autorizarMercado(user, mercadoId))) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    if (body.aceitarContrato === true) {
      const resumo = await aceitarContratoParceiro(
        mercadoId,
        user.id,
        (user as { name?: string }).name
      );
      return NextResponse.json({ success: true, data: resumo });
    }

    if (body.tier != null) {
      const tier = Number(body.tier) as ParceiroTier;
      if (![1, 2, 3].includes(tier)) {
        return NextResponse.json({ success: false, error: 'tier inválido' }, { status: 400 });
      }
      if (tier >= 2) {
        const atual = await obterParceiroSla(mercadoId);
        if (!atual.contratoVigente) {
          return NextResponse.json(
            {
              success: false,
              error: 'Aceite o contrato de dados antes de subir para Tier 2 ou 3.',
            },
            { status: 400 }
          );
        }
      }
      const resumo = await salvarTierParceiro(mercadoId, tier);
      return NextResponse.json({ success: true, data: resumo });
    }

    return NextResponse.json({ success: false, error: 'Ação inválida' }, { status: 400 });
  } catch (e) {
    console.error('[parceiro-sla PATCH]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
