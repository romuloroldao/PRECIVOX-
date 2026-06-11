// API Route: Módulo de Compras e Reposição Inteligente
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isGestorAuthResponse, requireGestorApiAccess } from '@/lib/gestor-api-mercado';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const PONTO_REPOSICAO_PADRAO = 20;
const DEMANDA_DIARIA_PADRAO = 10 / 7;

export async function GET(
  request: NextRequest,
  { params }: { params: { mercadoId: string } }
) {
  try {
    const auth = await requireGestorApiAccess(request, params.mercadoId);
    if (isGestorAuthResponse(auth)) return auth.response;

    const mercadoId = auth.mercadoId;

    const estoquesBaixos = await prisma.estoques.findMany({
      where: {
        unidades: { mercadoId, ativa: true },
        produtos: { ativo: true },
        quantidade: { lt: PONTO_REPOSICAO_PADRAO },
      },
      select: {
        quantidade: true,
        produtos: {
          select: {
            id: true,
            nome: true,
            giroEstoqueMedio: true,
          },
        },
        unidades: {
          select: { nome: true },
        },
      },
      orderBy: { quantidade: 'asc' },
      take: 10,
    });

    const produtosProcessados = estoquesBaixos.map((item) => {
      const demandaDiaria =
        item.produtos.giroEstoqueMedio && item.produtos.giroEstoqueMedio > 0
          ? item.produtos.giroEstoqueMedio
          : DEMANDA_DIARIA_PADRAO;
      const diasRestantes = item.quantidade / demandaDiaria;
      const quantidadeRepor = Math.max(0, PONTO_REPOSICAO_PADRAO - item.quantidade);

      return {
        id: item.produtos.id,
        nome: item.produtos.nome,
        unidade: item.unidades.nome,
        estoqueAtual: item.quantidade,
        demandaDiaria: Number(demandaDiaria.toFixed(1)),
        diasRestantes: Number(diasRestantes.toFixed(1)),
        quantidadeRepor: Math.ceil(quantidadeRepor),
        prioridade:
          diasRestantes < 1 ? 'CRITICA' : diasRestantes < 3 ? 'ALTA' : 'MEDIA',
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        produtosEmRuptura: produtosProcessados,
        resumo: {
          totalProdutos: produtosProcessados.length,
          criticos: produtosProcessados.filter((p) => p.prioridade === 'CRITICA').length,
          altos: produtosProcessados.filter((p) => p.prioridade === 'ALTA').length,
        },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar dados de compras:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar dados de compras' },
      { status: 500 }
    );
  }
}
