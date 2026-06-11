import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import { prisma } from '@/lib/prisma';
import { configParaResposta, obterConfigParceiroAncora } from '@/lib/parceiros-ancora/config';
import { avaliarElegibilidadeParceiroAncora } from '@/lib/parceiros-ancora/elegibilidade';
import {
  designarParceiroAncora,
  listarParceirosAncoraRegiao,
} from '@/lib/parceiros-ancora/regiao';
import type { ParceiroAncoraTipo } from '@/lib/parceiros-ancora/types';
import type { RegiaoOfertaModo } from '@/lib/oferta-agregada/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAdmin(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const mercadoId = req.nextUrl.searchParams.get('mercadoId');
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }

    const mercado = await prisma.mercados.findUnique({
      where: { id: mercadoId },
      select: { id: true, nome: true },
    });
    if (!mercado) {
      return NextResponse.json({ success: false, error: 'Mercado não encontrado' }, { status: 404 });
    }

    const [config, elegibilidade, regiao] = await Promise.all([
      obterConfigParceiroAncora(mercadoId),
      avaliarElegibilidadeParceiroAncora(mercadoId),
      listarParceirosAncoraRegiao(mercadoId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        mercado,
        config: configParaResposta(config),
        elegibilidade,
        regiao,
      },
    });
  } catch (e) {
    console.error('[admin/parceiros-ancora GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await requireAdmin(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const body = (await req.json()) as {
      mercadoId?: string;
      ativo?: boolean;
      tipo?: ParceiroAncoraTipo;
      regiaoModo?: RegiaoOfertaModo;
      prioridade?: number;
      rotulo?: string;
    };

    if (!body.mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }
    if (typeof body.ativo !== 'boolean') {
      return NextResponse.json({ success: false, error: 'ativo (boolean) obrigatório' }, { status: 400 });
    }

    const result = await designarParceiroAncora(
      body.mercadoId,
      {
        ativo: body.ativo,
        tipo: body.tipo,
        regiaoModo: body.regiaoModo,
        prioridade: body.prioridade,
        rotulo: body.rotulo,
      },
      user.id
    );

    if (result.ok === false) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    }

    const regiao = await listarParceirosAncoraRegiao(body.mercadoId);
    return NextResponse.json({
      success: true,
      data: {
        config: configParaResposta(result.config),
        regiao,
      },
    });
  } catch (e) {
    console.error('[admin/parceiros-ancora PATCH]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
