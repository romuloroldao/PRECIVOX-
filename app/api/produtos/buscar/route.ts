import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TokenManager } from '@/lib/token-manager';
import { EventCollector } from '@/lib/ai/event-collector';
import {
  buildProdutoWhereFromBuscaParams,
  buscaParamsFromSearchParams,
  whereProdutoComMercado,
} from '@/lib/produtos-busca-where';
import { getPrecoReferenciaRegionalParaProduto } from '@/lib/ai/conversao-metrics';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

async function registrarBuscasSemResultadoPorMercado(
  request: NextRequest,
  buscaTrim: string,
  page: number,
  baseWhere: Record<string, unknown>,
  estoqueFilter: Record<string, unknown>,
  mercadoFiltroUrl: string | null
): Promise<void> {
  if (page !== 1 || buscaTrim.length < 2) return;

  const user = await TokenManager.validateSession({
    headers: request.headers,
    cookies: request.cookies,
  });
  if (!user || user.id === 'anonymous') return;

  const termo = buscaTrim.slice(0, 200);

  const registrarSeZero = async (mercadoId: string) => {
    const whereM = whereProdutoComMercado(baseWhere, estoqueFilter, mercadoId);
    const count = await prisma.produtos.count({ where: whereM });
    if (count === 0) {
      await EventCollector.recordEvent(user.id, mercadoId, 'produto_buscado', {
        searchQuery: termo,
        resultados: 0,
      });
    }
  };

  if (mercadoFiltroUrl) {
    await registrarSeZero(mercadoFiltroUrl);
    return;
  }

  const mercados = await prisma.mercados.findMany({
    where: { ativo: true },
    select: { id: true },
  });

  await Promise.all(mercados.map((m) => registrarSeZero(m.id)));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10), 1), 100);
    const skip = (page - 1) * limit;

    const params = buscaParamsFromSearchParams(searchParams);
    const { whereProduct, estoqueFilter, hasEstoqueWhere } = buildProdutoWhereFromBuscaParams(params);
    const busca = params.busca?.trim() || '';

    if (busca.length >= 2) {
      void registrarBuscasSemResultadoPorMercado(
        request,
        busca,
        page,
        whereProduct,
        estoqueFilter,
        params.mercado
      ).catch(() => {});
    }

    const [produtos, total] = await Promise.all([
      prisma.produtos.findMany({
        where: whereProduct,
        skip,
        take: limit,
        orderBy: [{ nome: 'asc' }, { dataAtualizacao: 'desc' }],
        include: {
          estoques: {
            ...(hasEstoqueWhere ? { where: estoqueFilter } : {}),
            orderBy: [{ emPromocao: 'desc' }, { preco: 'asc' }, { atualizadoEm: 'desc' }],
            take: 1,
            include: {
              unidades: {
                include: {
                  mercados: true,
                },
              },
            },
          },
        },
      }),
      prisma.produtos.count({ where: whereProduct }),
    ]);

    const produtosFormatados = produtos.map((produto) => {
      const estoque = produto.estoques[0];
      const unidade = estoque?.unidades;
      const mercadoRel = unidade?.mercados;

      return {
        id: estoque?.id ?? `produto-${produto.id}`,
        nome: produto.nome ?? 'Produto',
        preco: estoque?.preco?.toNumber() ?? 0,
        precoPromocional: estoque?.precoPromocional?.toNumber() ?? null,
        emPromocao: estoque?.emPromocao || false,
        disponivel: estoque ? (estoque.quantidade ?? 0) > 0 : false,
        quantidade: estoque?.quantidade ?? 0,
        categoria: produto.categoria,
        marca: produto.marca,
        imagem: produto.imagem,
        unidade: {
          id: unidade?.id ?? 'sem-unidade',
          nome: unidade?.nome ?? 'Sem unidade',
          endereco: unidade?.endereco ?? '',
          cidade: unidade?.cidade ?? '',
          estado: unidade?.estado ?? '',
          mercado: {
            id: mercadoRel?.id ?? 'sem-mercado',
            nome: mercadoRel?.nome ?? 'Sem mercado',
          },
        },
        produto,
      };
    });

    const includeRef =
      request.nextUrl.searchParams.get('includeReferencia') === 'true' && params.mercado;
    const mercadoRef = params.mercado;

    let dataOut = produtosFormatados;
    if (includeRef && mercadoRef) {
      const cap = 36;
      const head = produtosFormatados.slice(0, cap);
      const tail = produtosFormatados.slice(cap);
      const enriched = await Promise.all(
        head.map(async (row) => {
          const pid = (row.produto as { id?: string })?.id;
          const preco =
            row.emPromocao && row.precoPromocional != null ? row.precoPromocional : row.preco;
          if (!pid || preco <= 0) {
            return { ...row, referenciaRegiao: null as { media: number; diferencaPct: number | null } | null };
          }
          const ref = await getPrecoReferenciaRegionalParaProduto(mercadoRef, pid, preco, 'ampla', 25);
          return {
            ...row,
            referenciaRegiao:
              ref.media != null
                ? { media: ref.media, diferencaPct: ref.diferencaPct }
                : null,
          };
        })
      );
      dataOut = [...enriched, ...tail];
    }

    return NextResponse.json(
      {
        success: true,
        data: dataOut,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + produtosFormatados.length < total,
        },
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Erro ao buscar produtos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno ao buscar produtos',
        message: err?.message || 'Erro desconhecido',
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
