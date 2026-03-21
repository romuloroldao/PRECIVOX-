import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * Monta o filtro aplicado a cada linha de estoque (mesmo objeto em
 * `produtos.estoques.some` e no `include.estoques.where` quando não vazio).
 * Quando não há filtros opcionais, retorna {} → "algum estoque existe".
 */
function buildEstoqueFilter(params: {
  disponivel: string | null;
  emPromocao: string | null;
  precoMin: string | null;
  precoMax: string | null;
  mercado: string | null;
  cidade: string | null;
}): Record<string, unknown> {
  const f: Record<string, unknown> = {};

  if (params.disponivel === 'true') {
    f.disponivel = true;
    f.quantidade = { gt: 0 };
  }

  if (params.emPromocao === 'true') {
    f.emPromocao = true;
  }

  if (params.precoMin || params.precoMax) {
    const preco: Record<string, number> = {};
    if (params.precoMin) preco.gte = parseFloat(params.precoMin);
    if (params.precoMax) preco.lte = parseFloat(params.precoMax);
    f.preco = preco;
  }

  const unidadeWhere: Record<string, string> = {};
  if (params.mercado) unidadeWhere.mercadoId = params.mercado;
  if (params.cidade) unidadeWhere.cidade = params.cidade;

  if (Object.keys(unidadeWhere).length > 0) {
    f.unidades = unidadeWhere;
  }

  return f;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const busca = searchParams.get('busca');
    const categoria = searchParams.get('categoria');
    const marca = searchParams.get('marca');
    const precoMin = searchParams.get('precoMin');
    const precoMax = searchParams.get('precoMax');
    const disponivel = searchParams.get('disponivel');
    const emPromocao = searchParams.get('emPromocao');
    const mercado = searchParams.get('mercado');
    const cidade = searchParams.get('cidade');
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10), 1), 100);
    const skip = (page - 1) * limit;

    const estoqueFilter = buildEstoqueFilter({
      disponivel,
      emPromocao,
      precoMin,
      precoMax,
      mercado,
      cidade,
    });

    const whereProduct: Record<string, unknown> = { ativo: true };
    const andClauses: Record<string, unknown>[] = [];

    if (busca) {
      andClauses.push({
        OR: [
          { nome: { contains: busca, mode: 'insensitive' } },
          { marca: { contains: busca, mode: 'insensitive' } },
          { codigoBarras: { contains: busca, mode: 'insensitive' } },
        ],
      });
    }

    if (categoria) {
      andClauses.push({ categoria });
    }

    if (marca && !busca) {
      andClauses.push({
        marca: { contains: marca, mode: 'insensitive' },
      });
    }

    // Catálogo do cliente: só produtos que tenham pelo menos uma linha de estoque
    // (evita lista “vazia” por produto sem oferta e alinha com dados reais de upload)
    andClauses.push({
      estoques: {
        some: estoqueFilter,
      },
    });

    if (andClauses.length > 0) {
      whereProduct.AND = andClauses;
    }

    const hasEstoqueWhere = Object.keys(estoqueFilter).length > 0;

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

    return NextResponse.json(
      {
        success: true,
        data: produtosFormatados,
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
