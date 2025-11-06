import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * GET /api/products/suggestions?q=termo
 * Retorna sugestões de produtos para autocomplete
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Buscar produtos que correspondem ao termo
    const produtos = await prisma.produtos.findMany({
      where: {
        ativo: true,
        OR: [
          {
            nome: {
              contains: q,
              mode: 'insensitive',
            },
          },
          {
            marca: {
              contains: q,
              mode: 'insensitive',
            },
          },
          {
            categoria: {
              contains: q,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        nome: true,
        categoria: true,
        marca: true,
        imagem: true,
      },
      take: 10,
      orderBy: {
        nome: 'asc',
      },
    });

    // Formatar como sugestões
    const suggestions = produtos.map((produto) => ({
      id: produto.id,
      name: produto.nome,
      category: produto.categoria || '',
      marca: produto.marca || '',
      imagem: produto.imagem,
    }));

    return NextResponse.json({
      success: true,
      data: suggestions,
    });
  } catch (error: any) {
    console.error('❌ Erro ao buscar sugestões:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar sugestões',
        message: error.message || 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
