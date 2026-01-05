import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Recomendacao {
  id: string;
  tipo: 'promocao' | 'economia' | 'tendencia' | 'personalizada';
  titulo: string;
  descricao: string;
  produtos: any[];
  economia?: number;
  confianca: number;
}

/**
 * GET /api/produtos/recomendacoes
 * Retorna recomendações inteligentes de produtos baseadas em promoções e histórico
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] GET /api/produtos/recomendacoes - Iniciando`);

    // Verificar autenticação - permitir acesso público com dados limitados
    const session = await getServerSession(authOptions);
    
    let userRole: string | null = null;
    let userId: string | null = null;
    let isAuthenticated = false;

    if (session && session.user) {
      isAuthenticated = true;
      userRole = (session.user as any).role;
      userId = (session.user as any).id;

      // Permite acesso para ADMIN, GESTOR e CLIENTE
      const allowedRoles = ['ADMIN', 'GESTOR', 'CLIENTE'];
      if (!allowedRoles.includes(userRole)) {
        console.warn(`[${requestId}] Acesso negado para role: ${userRole}`);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Acesso negado',
            code: 'FORBIDDEN'
          },
          { status: 403 }
        );
      }
    } else {
      // Usuário não autenticado - retornar dados públicos limitados
      console.log(`[${requestId}] Acesso não autenticado - retornando recomendações públicas`);
    }

    // Buscar produtos em promoção como recomendações
    const estoquesPromocao = await prisma.estoques.findMany({
      where: {
        emPromocao: true,
        disponivel: true,
        produtos: {
          ativo: true,
        },
      },
      include: {
        produtos: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            categoria: true,
            marca: true,
          },
        },
        unidades: {
          select: {
            id: true,
            nome: true,
            endereco: true,
            cidade: true,
            estado: true,
            mercadoId: true,
            mercados: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
      orderBy: {
        precoPromocional: 'asc',
      },
      take: 10,
    });

    // Se GESTOR autenticado, filtrar apenas produtos dos seus mercados
    if (isAuthenticated && userRole === 'GESTOR') {
      const mercadosDoGestor = await prisma.mercados.findMany({
        where: { gestorId: userId },
        select: { id: true },
      });

      const mercadoIds = mercadosDoGestor.map((m) => m.id);
      
      if (mercadoIds.length === 0) {
        console.log(`[${requestId}] Gestor sem mercados associados`);
        return NextResponse.json({
          success: true,
          recomendacoes: [],
          tipo: 'promocoes',
          descricao: 'Nenhuma recomendação disponível',
        });
      }

      // Filtrar estoques dos mercados do gestor
      const estoquesFiltrados = estoquesPromocao.filter((estoque) => {
        return mercadoIds.includes(estoque.unidades?.mercadoId || '');
      });

      // Converter para formato de recomendações
      const recomendacoes: Recomendacao[] = estoquesFiltrados.map((estoque, index) => {
        const economia = estoque.preco && estoque.precoPromocional
          ? Number(estoque.preco) - Number(estoque.precoPromocional)
          : 0;

        return {
          id: `rec-${estoque.id}-${index}`,
          tipo: 'promocao' as const,
          titulo: `Promoção: ${estoque.produtos?.nome || 'Produto'}`,
          descricao: `Economize R$ ${economia.toFixed(2)} em ${estoque.produtos?.nome || 'este produto'}`,
          produtos: [estoque],
          economia,
          confianca: 0.9,
        };
      });

      const duration = Date.now() - startTime;
      console.log(`[${requestId}] GET /api/produtos/recomendacoes - Sucesso (${recomendacoes.length} recomendações, ${duration}ms)`);

      return NextResponse.json({
        success: true,
        recomendacoes,
        tipo: 'promocoes',
        descricao: 'Produtos em promoção recomendados para você',
      }, {
        status: 200,
        headers: {
          'X-Request-ID': requestId,
          'X-Response-Time': `${duration}ms`,
        },
      });
    }

    // Para outros roles (ADMIN, CLIENTE) ou usuários não autenticados, retornar todas as promoções
    const recomendacoes: Recomendacao[] = estoquesPromocao.map((estoque, index) => {
      const economia = estoque.preco && estoque.precoPromocional
        ? Number(estoque.preco) - Number(estoque.precoPromocional)
        : 0;

      return {
        id: `rec-${estoque.id}-${index}`,
        tipo: 'promocao' as const,
        titulo: `Promoção: ${estoque.produtos?.nome || 'Produto'}`,
        descricao: `Economize R$ ${economia.toFixed(2)} em ${estoque.produtos?.nome || 'este produto'}`,
        produtos: [estoque],
        economia,
        confianca: 0.9,
      };
    });

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] GET /api/produtos/recomendacoes - Sucesso (${recomendacoes.length} recomendações, ${duration}ms)`);

    return NextResponse.json({
      success: true,
      recomendacoes,
      tipo: 'promocoes',
      descricao: 'Produtos em promoção recomendados para você',
    }, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': `${duration}ms`,
      },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] GET /api/produtos/recomendacoes - Erro:`, error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao buscar recomendações',
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { 
        status: 500,
        headers: {
          'X-Request-ID': requestId,
          'X-Response-Time': `${duration}ms`,
        },
      }
    );
  }
}

