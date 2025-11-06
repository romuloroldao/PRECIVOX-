import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Forçar renderização dinâmica para garantir dados sempre atualizados
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * GET /api/products
 * Retorna produtos com suporte a query params:
 * - search: busca por nome, marca ou código de barras
 * - category: filtro por categoria
 * - marketId: filtro por mercado (opcional)
 * - limit: limite de resultados (padrão: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const marketId = searchParams.get('marketId');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    // Construir filtros para produtos
    const where: any = {
      ativo: true,
    };

    // Filtro de busca (nome, marca ou código de barras)
    if (search) {
      where.OR = [
        {
          nome: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          marca: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          codigoBarras: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Filtro por categoria
    if (category) {
      where.categoria = category;
    }

    // Buscar produtos
    const produtos = await prisma.produtos.findMany({
      where,
      take: limit,
      orderBy: [
        { nome: 'asc' },
        { dataCriacao: 'desc' },
      ],
      include: {
        estoques: {
          where: {
            disponivel: true,
            quantidade: {
              gt: 0,
            },
          },
          include: {
            unidades: {
              include: {
                mercados: true,
              },
            },
          },
          orderBy: {
            preco: 'asc',
          },
          take: 10, // Pega os 10 menores preços para filtrar depois
        },
      },
    });

    // Se não há produtos, retornar lista vazia
    if (produtos.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    // Formatar resposta
    const produtosFormatados = produtos
      .map((produto) => {
        // Filtrar estoques por mercado se necessário
        let estoquesFiltrados = produto.estoques;
        if (marketId) {
          estoquesFiltrados = produto.estoques.filter(
            (estoque) => estoque.unidades.mercados.id === marketId
          );
        }
        
        const estoqueMenorPreco = estoquesFiltrados[0];
        
        return {
        id: produto.id,
        nome: produto.nome,
        descricao: produto.descricao,
        categoria: produto.categoria,
        marca: produto.marca,
        codigoBarras: produto.codigoBarras,
        unidadeMedida: produto.unidadeMedida,
        imagem: produto.imagem,
        preco: estoqueMenorPreco?.preco.toNumber() || null,
        precoPromocional: estoqueMenorPreco?.precoPromocional?.toNumber() || null,
        emPromocao: estoqueMenorPreco?.emPromocao || false,
        disponivel: estoqueMenorPreco ? estoqueMenorPreco.quantidade > 0 : false,
        quantidade: estoqueMenorPreco?.quantidade || 0,
        unidade: estoqueMenorPreco?.unidades ? {
          id: estoqueMenorPreco.unidades.id,
          nome: estoqueMenorPreco.unidades.nome,
          endereco: estoqueMenorPreco.unidades.endereco,
          cidade: estoqueMenorPreco.unidades.cidade,
          estado: estoqueMenorPreco.unidades.estado,
          mercado: {
            id: estoqueMenorPreco.unidades.mercados.id,
            nome: estoqueMenorPreco.unidades.mercados.nome,
          },
        } : null,
      };
      })
      .filter((produto) => {
        // Se há marketId, apenas retornar produtos que têm estoque nesse mercado
        if (marketId && !produto.unidade) {
          return false;
        }
        return true;
      });

    return NextResponse.json({
      success: true,
      data: produtosFormatados,
      count: produtosFormatados.length,
    });
  } catch (error: any) {
    console.error('❌ Erro ao buscar produtos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        message: error.message || 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
