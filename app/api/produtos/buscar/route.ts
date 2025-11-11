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

    // Construir filtros para produtos
    const produtoWhereArray: any[] = [
      { ativo: true }
    ];

    // Filtro de busca por nome do produto
    if (busca) {
      produtoWhereArray.push({
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
      produtoWhereArray.push({ categoria: categoria });
    }

    // Filtro por marca (apenas se não houver busca, pois busca já inclui marca)
    if (marca && !busca) {
      produtoWhereArray.push({
        marca: {
          contains: marca,
          mode: 'insensitive'
        }
      });
    }

    // Combinar todos os filtros com AND
    const produtoWhere = produtoWhereArray.length === 1 
      ? produtoWhereArray[0] 
      : { AND: produtoWhereArray };

    // Construir filtros para estoques
    const estoqueWhere: any = {
      produtos: produtoWhere
    };

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

    // Buscar estoques (que representam produtos nas unidades)
    const estoques = await prisma.estoques.findMany({
      where: estoqueWhere,
      include: {
        produtos: true,
        unidades: {
          include: {
            mercados: true
          }
        }
      },
      take: 500,
      orderBy: [
        { emPromocao: 'desc' },
        { preco: 'asc' },
        { atualizadoEm: 'desc' }
      ]
    });

    // Transformar estoques em formato esperado pelo frontend
    const produtos = estoques
      .filter((estoque) => {
        if (!estoque?.produtos) return false;
        if (!estoque?.unidades) return false;
        if (!estoque.unidades?.mercados) return false;
        return Boolean(estoque.unidades.mercados.id);
      })
      .map((estoque) => {
        const unidade = estoque.unidades;
        const mercado = unidade.mercados;

        return {
          id: estoque.id,
          nome: estoque.produtos.nome ?? 'Produto',
          preco: estoque.preco?.toNumber() ?? 0,
          precoPromocional: estoque.precoPromocional?.toNumber() ?? null,
          emPromocao: estoque.emPromocao || false,
          disponivel: (estoque.quantidade ?? 0) > 0,
          quantidade: estoque.quantidade ?? 0,
          categoria: estoque.produtos.categoria,
          marca: estoque.produtos.marca,
          unidade: {
            id: unidade.id,
            nome: unidade.nome ?? 'Unidade',
            endereco: unidade.endereco,
            cidade: unidade.cidade,
            estado: unidade.estado,
            mercado: {
              id: mercado.id,
              nome: mercado.nome ?? 'Mercado',
            }
          },
          produto: estoque.produtos
        };
      });

    return NextResponse.json(Array.isArray(produtos) ? produtos : [], {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('❌ Erro ao buscar produtos:', error);
    // Retorna array vazio em caso de erro para não quebrar o frontend
    return NextResponse.json(
      [],
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
