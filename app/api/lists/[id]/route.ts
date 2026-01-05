/**
 * GET /api/lists/[id]
 * 
 * SQUAD B - Backend
 * 
 * Retorna detalhes de uma lista
 * Cache: 5 minutos
 * Rate Limit: 60 req/min
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimiters } from '@/lib/rate-limiter';
import { getCached } from '@/lib/redis';

export const dynamic = 'force-dynamic';

async function fetchListFromDB(listId: string) {
  // Buscar lista com itens
  const lista = await prisma.listas_compras.findUnique({
    where: { id: listId },
      include: {
        itens_lista: {
          include: {
            produtos: {
              select: {
                id: true,
                nome: true,
                categoria: true,
                estoques: {
                  select: {
                    preco: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!lista) {
    return null;
  }

  // Formatar produtos com economia
    const productsWithSavings = lista.itens_lista.map((item) => {
      const product = item.produtos;
      const prices = product.estoques.map(e => Number(e.preco));
      const avgPrice = prices.length > 0 
        ? prices.reduce((sum, p) => sum + p, 0) / prices.length 
        : 0;
      const bestPrice = Math.floor(avgPrice * 0.85); // 15% desconto
      const savings = avgPrice - bestPrice;

      return {
        id: product.id,
        name: product.nome,
        quantity: item.quantidade,
        bestPrice,
        avgPrice,
        savings,
        bestMarket: {
          id: 'mock-market-1',
          name: 'Supermercado Econômico',
          distance: 1.2,
        },
      };
    });

  const totalSavings = productsWithSavings.reduce(
    (sum, p) => sum + p.savings * p.quantity,
    0
  );

  return {
    id: lista.id,
    name: lista.nome,
    products: productsWithSavings,
    totalSavings,
    updatedAt: lista.updatedAt.toISOString(),
  };
}

async function handler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Buscar do cache Redis (5 minutos) ou do banco
    const data = await getCached(
      `list:${id}`,
      () => fetchListFromDB(id),
      300 // 5 minutos
    );

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Lista não encontrada',
        },
        { status: 404 }
      );
    }

    const response = {
      success: true,
      data,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache-Key': `list-${id}`,
      },
    });
  } catch (error) {
    console.error('Error fetching list:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erro ao buscar lista',
      },
      { status: 500 }
    );
  }
}

// Aplicar rate limiting: 60 req/min
export const GET = rateLimiters.listsGet(handler);
