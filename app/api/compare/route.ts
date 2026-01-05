/**
 * POST /api/compare
 * 
 * SQUAD B - Backend
 * 
 * Compara preços de produtos em diferentes mercados
 * Cache: 10 minutos
 * Rate Limit: 30 req/min
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimiters } from '@/lib/rate-limiter';
import { autoUnlockBadgesServer } from '@/lib/gamification-server';

async function handler(request: NextRequest) {
  try {
    const body = await request.json();
    const { productIds, location, userId } = body; // userId opcional para gamificação

    // Validação
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'productIds deve ser um array não vazio',
        },
        { status: 400 }
      );
    }

    // Buscar produtos com seus estoques (preços)
    const products = await prisma.produtos.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        nome: true,
        estoques: {
          select: {
            preco: true,
            disponivel: true,
            unidades: {
              select: {
                mercadoId: true,
              },
            },
          },
        },
      },
    });

    if (products.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Nenhum produto encontrado',
        },
        { status: 404 }
      );
    }

    // Buscar todos os mercados disponíveis
    const markets = await prisma.mercados.findMany({
      where: {
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
      },
    });

    // Criar mapa de mercados
    const marketMap = new Map(markets.map((m) => [m.id, m]));

    // Agrupar produtos e calcular comparações
    const productsComparison = products.map((product) => {
      // Calcular preço médio dos estoques do produto
      const estoquePrices = product.estoques.map(e => Number(e.preco));
      const basePrice = estoquePrices.length > 0 
        ? estoquePrices.reduce((sum, p) => sum + p, 0) / estoquePrices.length 
        : 0;
      
      // Buscar preços reais dos estoques por mercado
      const marketPrices = markets.map((market) => {
        // Encontrar estoque do produto neste mercado
        const estoque = product.estoques.find(
          (e) => e.unidades?.mercadoId === market.id
        );
        
        const price = estoque ? Number(estoque.preco) : basePrice;
        const distance = location
          ? Math.random() * 5 // 0-5km (simulado)
          : 0;

        return {
          marketId: market.id,
          marketName: market.nome,
          price: Math.floor(price),
          distance: parseFloat(distance.toFixed(1)),
          inStock: estoque ? estoque.disponivel : false,
        };
      });

      // Encontrar melhor oferta
      const inStockPrices = marketPrices.filter((p) => p.inStock);
      const bestDeal = inStockPrices.length > 0 
        ? inStockPrices.reduce((best, current) => {
            return current.price < best.price ? current : best;
          }, inStockPrices[0])
        : { marketId: markets[0]?.id || '', price: basePrice };

      const avgPrice = Math.floor(
        marketPrices.reduce((sum, p) => sum + p.price, 0) / marketPrices.length
      );

      return {
        id: product.id,
        name: product.nome,
        prices: marketPrices.sort((a, b) => a.price - b.price),
        bestDeal: {
          marketId: bestDeal.marketId,
          price: bestDeal.price,
          savings: avgPrice - bestDeal.price,
        },
      };
    });

    const totalSavings = productsComparison.reduce(
      (sum, p) => sum + p.bestDeal.savings,
      0
    );

    // Desbloquear badges automaticamente se houver economia e userId
    if (userId && totalSavings > 0) {
      try {
        await autoUnlockBadgesServer(userId, 'savings_added', totalSavings);
      } catch (error) {
        console.error('Error unlocking badges:', error);
        // Continuar mesmo se gamificação falhar
      }
    }

    const response = {
      success: true,
      data: {
        products: productsComparison,
        totalSavings,
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        'X-Cache-Key': `compare-${productIds.join('-')}`,
      },
    });
  } catch (error) {
    console.error('Error comparing prices:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erro ao comparar preços',
      },
      { status: 500 }
    );
  }
}

// Aplicar rate limiting: 30 req/min
export const POST = rateLimiters.compare(handler);
