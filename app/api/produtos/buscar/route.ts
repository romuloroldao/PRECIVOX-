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

    // Construir filtros para estoques
    const where: any = {
      produtos: {
        ativo: true
      }
    };

    // Filtro de busca por nome do produto
    if (busca) {
      where.produtos = {
        ...where.produtos,
        nome: {
          contains: busca,
          mode: 'insensitive'
        }
      };
    }

    // Filtro por categoria
    if (categoria) {
      where.produtos = {
        ...where.produtos,
        categoria
      };
    }

    // Filtro por marca
    if (marca) {
      where.produtos = {
        ...where.produtos,
        marca
      };
    }

    // Filtro de disponibilidade
    if (disponivel === 'true') {
      where.quantidade = {
        gt: 0
      };
    }

    // Filtro por mercado
    if (mercado) {
      where.unidades = {
        mercadoId: mercado
      };
    }

    // Filtro por cidade
    if (cidade) {
      where.unidades = {
        ...where.unidades,
        cidade
      };
    }

    // Filtro de preço
    if (precoMin || precoMax) {
      where.preco = {};
      if (precoMin) where.preco.gte = parseFloat(precoMin);
      if (precoMax) where.preco.lte = parseFloat(precoMax);
    }

    // Buscar estoques (que representam produtos nas unidades)
    const estoques = await prisma.estoques.findMany({
      where,
      include: {
        produtos: true,
        unidades: {
          include: {
            mercados: true
          }
        }
      },
      take: 100,
      orderBy: {
        preco: 'asc'
      }
    });

    // Transformar estoques em formato esperado pelo frontend
    const produtos = estoques.map(estoque => ({
      id: estoque.id,
      nome: estoque.produtos.nome,
      preco: estoque.preco.toNumber(),
      precoPromocional: estoque.precoPromocional?.toNumber(),
      emPromocao: estoque.emPromocao || false,
      disponivel: estoque.quantidade > 0,
      quantidade: estoque.quantidade,
      categoria: estoque.produtos.categoria,
      marca: estoque.produtos.marca,
      unidade: {
        id: estoque.unidades.id,
        nome: estoque.unidades.nome,
        endereco: estoque.unidades.endereco,
        cidade: estoque.unidades.cidade,
        estado: estoque.unidades.estado,
        mercado: {
          id: estoque.unidades.mercados.id,
          nome: estoque.unidades.mercados.nome
        }
      },
      produto: estoque.produtos
    }));

    return NextResponse.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
