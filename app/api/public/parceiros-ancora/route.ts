import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { listarParceirosAncoraRegiao } from '@/lib/parceiros-ancora/regiao';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const mercadoId = req.nextUrl.searchParams.get('mercadoId');
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }

    const mercado = await prisma.mercados.findUnique({
      where: { id: mercadoId, ativo: true },
      select: { id: true, nome: true },
    });
    if (!mercado) {
      return NextResponse.json({ success: false, error: 'Mercado não encontrado' }, { status: 404 });
    }

    const regiao = await listarParceirosAncoraRegiao(mercadoId);
    if (regiao.ancoraCount === 0) {
      return NextResponse.json({
        success: true,
        data: {
          ativo: false,
          mercadoNome: mercado.nome,
          explicacao: null,
          parceiros: [],
        },
      });
    }

    const explicacao = regiao.regiaoCompleta
      ? `${regiao.ancoraCount} parceiros âncora cobrem ${regiao.regiaoDescricao} — preços de referência regional.`
      : `${regiao.ancoraCount}/${regiao.metaMin} parceiros âncora em ${regiao.regiaoDescricao} — rede piloto em expansão.`;

    return NextResponse.json({
      success: true,
      data: {
        ativo: true,
        mercadoNome: mercado.nome,
        regiaoDescricao: regiao.regiaoDescricao,
        regiaoCompleta: regiao.regiaoCompleta,
        explicacao,
        parceiros: regiao.parceiros.map((p) => ({
          mercadoId: p.mercadoId,
          nome: p.nome,
          tipoLabel: p.tipoLabel,
          selo: p.selo,
          rotulo: p.rotulo,
        })),
      },
    });
  } catch (e) {
    console.error('[public/parceiros-ancora GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
