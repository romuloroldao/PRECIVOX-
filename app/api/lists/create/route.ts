/**
 * POST /api/lists/create
 * 
 * SQUAD B - Backend
 * 
 * Cria nova lista de compras
 * Rate Limit: 10 req/min por usuário
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimiters, checkRateLimit, getUserIdentifier } from '@/lib/rate-limiter';
import { autoUnlockBadgesServer } from '@/lib/gamification-server';
import { invalidate, invalidatePattern } from '@/lib/redis';
import { EventCollector } from '@/lib/ai/event-collector';

async function handler(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, products } = body;
    
    // Rate limiting por usuário (10 req/min) - verificar após ler body
    let userLimitResult: ReturnType<typeof checkRateLimit> | null = null;
    if (userId) {
      const userIdentifier = getUserIdentifier(request, userId);
      userLimitResult = checkRateLimit(userIdentifier, 10, 60 * 1000);
      
      if (!userLimitResult.allowed) {
        const retryAfter = Math.ceil((userLimitResult.resetAt - Date.now()) / 1000);
        
        return NextResponse.json(
          {
            success: false,
            error: 'Rate limit exceeded',
            message: `Too many requests for this user. Try again after ${new Date(userLimitResult.resetAt).toISOString()}`,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': userLimitResult.limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': userLimitResult.resetAt.toString(),
              'Retry-After': retryAfter.toString(),
            },
          }
        );
      }
    }

    // Validação
    if (!userId || !name || !Array.isArray(products)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'userId, name e products são obrigatórios',
        },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Usuário não encontrado',
        },
        { status: 404 }
      );
    }

    // Criar lista
    const lista = await prisma.listas_compras.create({
      data: {
        nome: name,
        usuarioId: userId,
        ativo: true,
      },
    });

    // Buscar detalhes dos produtos
    const productDetails = await prisma.produtos.findMany({
      where: {
        id: {
          in: products,
        },
      },
      select: {
        id: true,
        nome: true,
        estoques: {
          select: {
            preco: true,
          },
        },
      },
    });

    // Adicionar produtos à lista
    if (productDetails.length > 0) {
      await prisma.itens_lista.createMany({
        data: productDetails.map((product) => ({
          listaId: lista.id,
          produtoId: product.id,
          quantidade: 1,
          comprado: false,
        })),
      });
    }

    // Calcular economia estimada
    const totalNormalPrice = productDetails.reduce((sum, p) => {
      const prices = p.estoques.map(e => Number(e.preco));
      const avgPrice = prices.length > 0 
        ? prices.reduce((s, price) => s + price, 0) / prices.length 
        : 0;
      return sum + avgPrice;
    }, 0);
    const estimatedSavings = Math.floor(totalNormalPrice * 0.15); // 15% de economia média

    // Desbloquear badges automaticamente (não bloquear se falhar)
    try {
      await autoUnlockBadgesServer(userId, 'list_created');
      // Invalidar cache de badges do usuário
      await invalidate(`badges:${userId}`);
    } catch (error) {
      console.error('Error unlocking badges:', error);
      // Continuar mesmo se gamificação falhar
    }

    // Invalidar cache de stats globais (nova lista criada)
    try {
      await invalidate('stats:global');
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }

    // Registrar evento de lista criada para IA
    try {
      // Buscar mercadoId do primeiro produto (se houver)
      const primeiroProduto = productDetails[0];
      if (primeiroProduto && primeiroProduto.estoques.length > 0) {
        // Assumindo que estoque tem unidade que tem mercado
        // Por enquanto, usar mercadoId do body se fornecido, ou buscar
        const mercadoId = body.mercadoId || 'unknown';
        await EventCollector.recordEvent(
          userId,
          mercadoId,
          'lista_criada',
          { listaId: lista.id, produtosCount: productDetails.length }
        );
      }
    } catch (error) {
      console.error('Error recording list created event:', error);
      // Não quebrar se falhar
    }

    // Formatar resposta
    const productsWithPrices = productDetails.map((product) => {
      const prices = product.estoques.map(e => Number(e.preco));
      const avgPrice = prices.length > 0 
        ? prices.reduce((sum, p) => sum + p, 0) / prices.length 
        : 0;
      const bestPrice = Math.floor(avgPrice * 0.85); // 15% desconto
      
      return {
        id: product.id,
        name: product.nome,
        bestPrice,
        avgPrice,
      };
    });

    const response = {
      success: true,
      data: {
        listId: lista.id,
        name: lista.nome,
        products: productsWithPrices,
        estimatedSavings,
        createdAt: lista.createdAt.toISOString(),
      },
    };

    // Adicionar headers de rate limit se aplicável
    const headers: Record<string, string> = {};
    if (userLimitResult) {
      headers['X-RateLimit-Limit'] = userLimitResult.limit.toString();
      headers['X-RateLimit-Remaining'] = userLimitResult.remaining.toString();
      headers['X-RateLimit-Reset'] = userLimitResult.resetAt.toString();
    }

    return NextResponse.json(response, { 
      status: 201,
      headers,
    });
  } catch (error) {
    console.error('Error creating list:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erro ao criar lista de compras',
      },
      { status: 500 }
    );
  }
}

// Aplicar rate limiting: 10 req/min por usuário
export const POST = rateLimiters.listsCreate(handler);
