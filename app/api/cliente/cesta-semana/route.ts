import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { prisma } from '@/lib/prisma';
import { EventCollector } from '@/lib/ai/event-collector';
import {
  planejarCestaSemana,
  resolverItensListaCestaSemana,
  nomeListaCestaSemana,
} from '@/lib/cesta-semana';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });
    if (!user?.id || user.id === 'anonymous') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const mercadoId = req.nextUrl.searchParams.get('mercadoId');
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { perfilPreci: true },
    });

    const planejado = await planejarCestaSemana(user.id, mercadoId, dbUser?.perfilPreci);

    return NextResponse.json({
      success: true,
      data: {
        ...planejado,
        nomeSugerido: nomeListaCestaSemana(),
      },
    });
  } catch (e) {
    console.error('[cesta-semana GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });
    if (!user?.id || user.id === 'anonymous') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const mercadoId = body.mercadoId as string | undefined;
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { perfilPreci: true },
    });

    const planejado = await planejarCestaSemana(user.id, mercadoId, dbUser?.perfilPreci);
    if (planejado.itens.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sem itens suficientes para montar a cesta da semana' },
        { status: 422 }
      );
    }

    const produtoIds = planejado.itens.map((i) => i.produtoId);
    const itensLista = await resolverItensListaCestaSemana(produtoIds, mercadoId);

    if (itensLista.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Produtos da cesta não estão disponíveis neste mercado agora',
        },
        { status: 422 }
      );
    }

    const nome = (body.nome as string) || nomeListaCestaSemana();

    try {
      await EventCollector.recordEvent(user.id, mercadoId, 'lista_criada', {
        origem: 'cesta_semana',
        itensCount: itensLista.length,
        planejados: planejado.totalPlanejado,
      });
    } catch {
      /* não bloquear */
    }

    return NextResponse.json({
      success: true,
      data: {
        nome,
        itens: itensLista,
        resumo: planejado.resumo,
        planejados: planejado.itens,
        adicionados: itensLista.length,
        omitidos: planejado.itens.length - itensLista.length,
        redirectUrl: '/cliente/busca',
      },
    });
  } catch (e) {
    console.error('[cesta-semana POST]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
