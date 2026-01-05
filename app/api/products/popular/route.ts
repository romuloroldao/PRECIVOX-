/**
 * GET /api/products/popular
 * 
 * SQUAD B - Backend
 * 
 * Retorna produtos mais populares
 * Cache: 1 hora
 * Rate Limit: 60 req/min
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimiters } from '@/lib/rate-limiter';
import { getCached } from '@/lib/redis';

export const dynamic = 'force-dynamic';

async function fetchPopularProducts(limit: number, category?: string) {
  // Buscar produtos mais populares
    // Critério: produtos mais presentes em listas de compras
    const whereClause: any = {
      ativo: true,
    };

    if (category) {
      whereClause.categoria = category;
    }

    const products = await prisma.produtos.findMany({
      where: whereClause,
      take: limit,
      orderBy: {
        // TODO: Adicionar campo de popularidade ou contar em listas
        nome: 'asc', // Temporário
      },
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
    });

    // Calcular preço médio e range (simulado)
    const productsWithStats = products.map((product) => {
      const prices = product.estoques.map(e => Number(e.preco));
      const basePrice = prices.length > 0 
        ? prices.reduce((sum, p) => sum + p, 0) / prices.length 
        : 0;
      const variation = basePrice * 0.15; // 15% de variação

      return {
        id: product.id,
        name: product.nome,
        category: product.categoria || 'Geral',
        avgPrice: basePrice,
        priceRange: {
          min: Math.floor(basePrice - variation),
          max: Math.floor(basePrice + variation),
        },
        popularity: Math.floor(Math.random() * 100), // TODO: Calcular real
      };
    });

  return {
    products: productsWithStats,
    total: productsWithStats.length,
  };
}

async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const category = searchParams.get('category') || undefined;

    // Buscar do cache Redis (1 hora) ou do banco
    const cacheKey = `products:popular:${category || 'all'}:${limit}`;
    const data = await getCached(
      cacheKey,
      () => fetchPopularProducts(limit, category),
      3600 // 1 hora
    );

    const response = {
      success: true,
      data,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'X-Cache-Key': cacheKey,
      },
    });
  } catch (error) {
    console.error('Error fetching popular products:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erro ao buscar produtos populares',
      },
      { status: 500 }
    );
  }
}

// Aplicar rate limiting: 60 req/min
export const GET = rateLimiters.productsPopular(handler);
