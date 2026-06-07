import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { obterConfigOfertaAgregada } from '@/lib/oferta-agregada/config';
import { montarCestaOfertaAgregada } from '@/lib/oferta-agregada/cesta-mercado';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/oferta-agregada?mercadoId=
 * Resumo público quando o mercado aceita oferta agregada regional.
 */
export async function GET(req: NextRequest) {
  try {
    const mercadoId = req.nextUrl.searchParams.get('mercadoId');
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }

    const mercado = await prisma.mercados.findFirst({
      where: { id: mercadoId, ativo: true },
      select: { id: true, nome: true },
    });
    if (!mercado) {
      return NextResponse.json({ success: false, error: 'Mercado não encontrado' }, { status: 404 });
    }

    const config = await obterConfigOfertaAgregada(mercadoId);
    if (!config.ativo) {
      return NextResponse.json({
        success: true,
        data: {
          ativo: false,
          mercadoNome: mercado.nome,
          explicacao: 'Este mercado ainda não ativou a oferta agregada da região.',
        },
      });
    }

    const cesta = await montarCestaOfertaAgregada(mercadoId);
    const top = cesta.itens.filter((i) => i.emEstoque).slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        ativo: true,
        mercadoNome: mercado.nome,
        regiaoDescricao: cesta.regiaoDescricao,
        consumidoresUnicos: cesta.consumidoresUnicos,
        periodoDias: cesta.periodoDias,
        aceiteEm: config.aceiteEm,
        topItens: top.map((i) => ({
          nome: i.produtoNome ?? i.nomeRegional,
          sinais: i.demandaRegional.sinais,
          pressao: i.demandaRegional.pressao,
          preco: i.preco,
        })),
        explicacao: `${mercado.nome} aceita atender a cesta agregada do bairro (${cesta.regiaoDescricao}). ${cesta.consumidoresUnicos} consumidor(es) na região geraram demanda nos últimos ${cesta.periodoDias} dias.`,
      },
    });
  } catch (e) {
    console.error('[cliente/oferta-agregada]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
