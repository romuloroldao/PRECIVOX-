import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import type { ItemLista } from '@/app/context/ListaContext';
import { coordsMercadosFromDb } from '@/lib/lista-rota-proposta';
import { computeShoppingRouteOtimizada } from '@/lib/lista-rota-ia';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type LinhaEntrada = {
  lineId: string;
  estoqueId: string;
  mercadoId: string;
  unidadeId: string;
  quantidade: number;
  mercadoNome?: string;
  produtoNome?: string;
  preco?: number;
  precoPromocional?: number;
  emPromocao?: boolean;
};

function toItemListaFromLinha(l: LinhaEntrada, mercadoNome: string, unidadeNome: string): ItemLista {
  return {
    id: l.lineId,
    estoqueId: l.estoqueId,
    nome: l.produtoNome ?? 'Produto',
    preco: l.preco ?? 0,
    precoPromocional: l.precoPromocional,
    emPromocao: l.emPromocao ?? false,
    quantidade: l.quantidade,
    unidade: {
      id: l.unidadeId,
      nome: unidadeNome,
      mercado: { id: l.mercadoId, nome: mercadoNome },
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = (await req.json()) as { itens?: LinhaEntrada[] };
    const linhas = Array.isArray(body.itens) ? body.itens : [];
    if (linhas.length < 2) {
      return NextResponse.json({ rota: null });
    }

    const mercadoIds = [...new Set(linhas.map((l) => l.mercadoId).filter(Boolean))];
    if (mercadoIds.length < 2) {
      return NextResponse.json({ rota: null });
    }

    const nomesMercado = new Map<string, string>();
    const mercados = await prisma.mercados.findMany({
      where: { id: { in: mercadoIds } },
      select: { id: true, nome: true },
    });
    for (const m of mercados) nomesMercado.set(m.id, m.nome ?? 'Mercado');

    const itens: ItemLista[] = linhas.map((l) =>
      toItemListaFromLinha(
        l,
        l.mercadoNome ?? nomesMercado.get(l.mercadoId) ?? 'Mercado',
        ''
      )
    );

    const coords = await coordsMercadosFromDb(mercadoIds);
    const rota = computeShoppingRouteOtimizada(itens, coords);

    return NextResponse.json({
      rota: {
        passos: rota.passos.map((p) => ({
          ordem: p.ordem,
          mercadoId: p.mercadoId,
          mercadoNome: p.mercadoNome,
          subtotal: p.subtotal,
          qtdLinhas: p.qtdLinhas,
        })),
        distanciaTotalKm: rota.distanciaTotalKm,
        metodo: rota.metodo,
      },
    });
  } catch (e) {
    console.error('[POST /api/cliente/rota-otimizada]', e);
    return NextResponse.json({ error: 'Erro ao otimizar rota' }, { status: 500 });
  }
}
