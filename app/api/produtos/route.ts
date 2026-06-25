import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiSession, isAuthResponse } from '@/lib/api-auth';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiSession(request, { roles: ['ADMIN', 'GESTOR'] });
    if (isAuthResponse(auth)) return auth;

    const userRole = auth.role;
    const userId = auth.id;

    const { searchParams } = new URL(request.url);
    const busca = searchParams.get('busca') || '';
    const categoria = searchParams.get('categoria') || '';
    const unidadeId = searchParams.get('unidadeId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Construir where clause
    const whereConditions: any[] = [];

    // Filtro de busca (nome, código de barras)
    if (busca) {
      whereConditions.push({
        OR: [
          { nome: { contains: busca, mode: 'insensitive' } },
          { codigoBarras: { contains: busca, mode: 'insensitive' } },
        ],
      });
    }

    // Filtro por categoria
    if (categoria) {
      whereConditions.push({ categoria: categoria });
    }

    // Filtro de estoque (unidade ou mercado)
    const estoqueFilter: any = {};

    // Se for GESTOR, filtrar apenas produtos do seu mercado
    if (userRole === 'GESTOR') {
      const mercadosDoGestor = await prisma.mercados.findMany({
        where: { gestorId: userId },
        select: { id: true },
      });

      const mercadoIds = mercadosDoGestor.map((m) => m.id);

      if (mercadoIds.length === 0) {
        // Gestor sem mercados associados
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
      }

      estoqueFilter.unidades = {
        mercadoId: { in: mercadoIds },
      };

      // Se tiver filtro de unidade específica, adicionar
      if (unidadeId) {
        estoqueFilter.unidadeId = unidadeId;
      }
    } else if (unidadeId) {
      // Se for ADMIN e tiver filtro de unidade
      estoqueFilter.unidadeId = unidadeId;
    }

    // Adicionar filtro de estoque se houver condições
    if (Object.keys(estoqueFilter).length > 0) {
      whereConditions.push({
        estoques: {
          some: estoqueFilter,
        },
      });
    }

    // Combinar todas as condições com AND
    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    // Buscar produtos com estoques
    const [produtos, total] = await Promise.all([
      prisma.produtos.findMany({
        where,
        skip,
        take: limit,
        include: {
          estoques: {
            include: {
              unidades: {
                select: {
                  id: true,
                  nome: true,
                  mercadoId: true,
                },
              },
            },
          },
        },
        orderBy: { dataAtualizacao: 'desc' },
      }),
      prisma.produtos.count({ where }),
    ]);

    // Formatar resposta com informações agregadas
    const produtosFormatados = produtos.map((produto) => {
      const estoques = produto.estoques || [];
      const precoMedio =
        estoques.length > 0
          ? estoques.reduce((acc, e) => acc + Number(e.preco), 0) / estoques.length
          : 0;
      const quantidadeTotal = estoques.reduce((acc, e) => acc + e.quantidade, 0);
      const emPromocao = estoques.some((e) => e.emPromocao);

      return {
        id: produto.id,
        nome: produto.nome,
        descricao: produto.descricao,
        categoria: produto.categoria,
        codigoBarras: produto.codigoBarras,
        marca: produto.marca,
        unidadeMedida: produto.unidadeMedida,
        imagem: produto.imagem,
        imagemThumb: produto.imagemThumb,
        imagemStatus: produto.imagemStatus,
        ativo: produto.ativo,
        precoMedio: precoMedio.toFixed(2),
        quantidadeTotal,
        emPromocao,
        estoques: estoques.map((e) => ({
          id: e.id,
          unidadeId: e.unidadeId,
          unidadeNome: e.unidades?.nome,
          preco: Number(e.preco),
          precoPromocional: e.precoPromocional ? Number(e.precoPromocional) : null,
          quantidade: e.quantidade,
          emPromocao: e.emPromocao,
          disponivel: e.disponivel,
        })),
        dataCriacao: produto.dataCriacao,
        dataAtualizacao: produto.dataAtualizacao,
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
      },
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}

