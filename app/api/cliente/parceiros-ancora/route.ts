import { NextRequest, NextResponse } from 'next/server';
import { listarParceirosAncoraRegiao } from '@/lib/parceiros-ancora/regiao';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const mercadoId = req.nextUrl.searchParams.get('mercadoId');
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }

    const regiao = await listarParceirosAncoraRegiao(mercadoId);
    if (regiao.ancoraCount === 0) {
      return NextResponse.json({
        success: true,
        data: { ativo: false, parceiros: [], explicacao: null },
      });
    }

    const explicacao = regiao.regiaoCompleta
      ? `Rede piloto com ${regiao.ancoraCount} parceiros âncora em ${regiao.regiaoDescricao}.`
      : `Piloto regional: ${regiao.ancoraCount} parceiro(s) âncora em ${regiao.regiaoDescricao}.`;

    return NextResponse.json({
      success: true,
      data: {
        ativo: true,
        regiaoDescricao: regiao.regiaoDescricao,
        regiaoCompleta: regiao.regiaoCompleta,
        explicacao,
        parceiros: regiao.parceiros.slice(0, 5),
      },
    });
  } catch (e) {
    console.error('[cliente/parceiros-ancora GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
