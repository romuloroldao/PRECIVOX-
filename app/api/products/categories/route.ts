import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * GET /api/products/categories
 * Retorna lista de todas as categorias disponíveis
 */
export async function GET(request: NextRequest) {
  try {
    // Buscar todas as categorias distintas dos produtos ativos
    // Usar groupBy para melhor performance
    const categoriasRaw = await prisma.produtos.groupBy({
      by: ['categoria'],
      where: {
        ativo: true,
        categoria: {
          not: null,
        },
      },
    });

    // Extrair apenas os valores não nulos
    const categorias = categoriasRaw
      .map(item => item.categoria)
      .filter((cat): cat is string => cat !== null)
      .sort();

    // Extrair categorias e contar produtos por categoria
    const categoriasComContagem = await Promise.all(
      categorias.map(async (categoriaNome) => {
        const count = await prisma.produtos.count({
          where: {
            ativo: true,
            categoria: categoriaNome,
          },
        });

        return {
          nome: categoriaNome,
          count,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: categoriasComContagem,
    });
  } catch (error: any) {
    console.error('❌ Erro ao buscar categorias:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar categorias',
        message: error.message || 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
