import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

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

    // Filtros do produto (base para paginação)
    const whereProduct: any = { ativo: true };
    const andClauses: any[] = [];

    // Filtro de busca por nome do produto
    if (busca) {
      andClauses.push({
        OR: [
          {
            nome: {
              contains: busca,
              mode: 'insensitive'
            }
          },
          {
            marca: {
              contains: busca,
              mode: 'insensitive'
            }
          },
          {
            codigoBarras: {
              contains: busca,
              mode: 'insensitive'
            }
          }
        ]
      });
    }

    // Filtro por categoria
    if (categoria) {
      andClauses.push({ categoria });
    }

    // Filtro por marca (apenas se não houver busca, pois busca já inclui marca)
    if (marca && !busca) {
      andClauses.push({
        marca: {
          contains: marca,
          mode: 'insensitive'
        }
      });
    }

    // Filtros em estoques (lazy + futuro escalável)
    const estoqueWhere: any = {};

    // Filtro de disponibilidade
    if (disponivel === 'true') {
      estoqueWhere.disponivel = true;
      estoqueWhere.quantidade = {
        gt: 0
      };
    }

    // Filtro por promoção
    if (emPromocao === 'true') {
      estoqueWhere.emPromocao = true;
    }

    // Filtro de preço
    if (precoMin || precoMax) {
      estoqueWhere.preco = {};
      if (precoMin) estoqueWhere.preco.gte = parseFloat(precoMin);
      if (precoMax) estoqueWhere.preco.lte = parseFloat(precoMax);
    }

    // Construir filtros para unidades
    const unidadeWhere: any = {};

    // Filtro por mercado
    if (mercado) {
      unidadeWhere.mercadoId = mercado;
    }

    // Filtro por cidade
    if (cidade) {
      unidadeWhere.cidade = cidade;
    }

    // Adicionar filtro de unidade se houver
    if (Object.keys(unidadeWhere).length > 0) {
      estoqueWhere.unidades = unidadeWhere;
    }

    // Para não sobrecarregar: paginação no nível de produtos
    if (Object.keys(estoqueWhere).length > 0) {
      andClauses.push({
        estoques: {
          some: estoqueWhere,
        },
      });
    }

    if (andClauses.length > 0) {
      whereProduct.AND = andClauses;
    }

    const [produtos, total] = await Promise.all([
      prisma.produtos.findMany({
        where: whereProduct,
        skip,
        take: limit,
        orderBy: [{ nome: 'asc' }, { dataAtualizacao: 'desc' }],
        include: {
          estoques: {
            where: estoqueWhere,
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

    return NextResponse.json({
      success: true,
      data: produtosFormatados,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + produtosFormatados.length < total,
      },
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('❌ Erro ao buscar produtos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno ao buscar produtos',
        message: error?.message || 'Erro desconhecido',
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
