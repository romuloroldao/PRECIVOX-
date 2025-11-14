import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface AnalisePrecoResponse {
  id: string;
  produtoId: string;
  produtoNome: string;
  data: string;
  preco: number;
  precoMedio: number;
  precoMin: number;
  precoMax: number;
  tendencia: 'alta' | 'baixa' | 'estavel';
  recomendacao: string;
  moeda: string;
}

/**
 * GET /api/produtos/analises-precos
 * Retorna análises de preços dos produtos baseadas nos estoques
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] GET /api/produtos/analises-precos - Iniciando`);

    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.warn(`[${requestId}] Não autenticado`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não autenticado',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

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

    // Buscar parâmetros opcionais
    const { searchParams } = new URL(request.url);
    const produtoId = searchParams.get('produtoId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir filtro baseado no papel do usuário
    let whereCondition: any = {
      produtos: {
        ativo: true,
      },
      disponivel: true,
    };

    // Se GESTOR, filtrar apenas produtos dos seus mercados
    if (userRole === 'GESTOR') {
      const mercadosDoGestor = await prisma.mercados.findMany({
        where: { gestorId: userId },
        select: { id: true },
      });

      const mercadoIds = mercadosDoGestor.map((m) => m.id);
      
      if (mercadoIds.length === 0) {
        console.log(`[${requestId}] Gestor sem mercados associados`);
        return NextResponse.json({
          success: true,
          items: [],
          count: 0,
        });
      }

      // Filtrar pelos mercados através do relacionamento unidades
      whereCondition.unidades = {
        mercadoId: { in: mercadoIds },
      };
    }

    // Filtro por produto específico
    if (produtoId) {
      whereCondition.produtoId = produtoId;
    }

    // Buscar todos os estoques (sem limit para agrupar corretamente)
    const estoques = await prisma.estoques.findMany({
      where: whereCondition,
      include: {
        produtos: {
          select: {
            id: true,
            nome: true,
          },
        },
        unidades: {
          select: {
            id: true,
            mercadoId: true,
          },
        },
      },
      orderBy: {
        atualizadoEm: 'desc',
      },
    });

    console.log(`[${requestId}] Encontrados ${estoques.length} estoques`);

    // Agrupar por produtoId e calcular estatísticas
    const analisesPorProduto = new Map<string, {
      produtoId: string;
      produtoNome: string;
      precos: number[];
      precosPromocionais: number[];
      atualizacoes: Date[];
    }>();

    estoques.forEach((estoque) => {
      const produtoId = estoque.produtoId;
      const produtoNome = estoque.produtos?.nome || 'Produto desconhecido';
      
      if (!analisesPorProduto.has(produtoId)) {
        analisesPorProduto.set(produtoId, {
          produtoId,
          produtoNome,
          precos: [],
          precosPromocionais: [],
          atualizacoes: [],
        });
      }

      const analise = analisesPorProduto.get(produtoId)!;
      const preco = Number(estoque.preco);
      
      analise.precos.push(preco);
      analise.atualizacoes.push(estoque.atualizadoEm);
      
      if (estoque.emPromocao && estoque.precoPromocional) {
        analise.precosPromocionais.push(Number(estoque.precoPromocional));
      }
    });

    // Converter para array de análises e aplicar paginação
    const todasAnalises: AnalisePrecoResponse[] = Array.from(analisesPorProduto.values())
      .map((analise, index) => {
        const todosPrecos = [
          ...analise.precos,
          ...analise.precosPromocionais,
        ];

        const precoMedio = todosPrecos.length > 0
          ? todosPrecos.reduce((sum, p) => sum + p, 0) / todosPrecos.length
          : analise.precos.length > 0
          ? analise.precos.reduce((sum, p) => sum + p, 0) / analise.precos.length
          : 0;

        const precoMin = todosPrecos.length > 0
          ? Math.min(...todosPrecos)
          : analise.precos.length > 0
          ? Math.min(...analise.precos)
          : 0;

        const precoMax = todosPrecos.length > 0
          ? Math.max(...todosPrecos)
          : Math.max(...analise.precos);

        // Determinar tendência baseada na variação de preços
        let tendencia: 'alta' | 'baixa' | 'estavel' = 'estavel';
        if (analise.precos.length >= 2 && analise.atualizacoes.length >= 2) {
          // Criar array de preços com timestamps
          const precosComData = analise.precos.map((preco, idx) => ({
            preco,
            data: analise.atualizacoes[idx] || new Date(),
          }));
          
          // Ordenar por data (mais antigo primeiro)
          precosComData.sort((a, b) => a.data.getTime() - b.data.getTime());
          
          const maisAntigo = precosComData[0].preco;
          const maisRecente = precosComData[precosComData.length - 1].preco;
          const variacao = ((maisRecente - maisAntigo) / maisAntigo) * 100;
          
          if (variacao > 5) {
            tendencia = 'alta';
          } else if (variacao < -5) {
            tendencia = 'baixa';
          }
        }

        // Gerar recomendação baseada na análise
        let recomendacao = '';
        if (tendencia === 'alta') {
          recomendacao = 'Preço em alta. Considere comprar agora ou buscar alternativas.';
        } else if (tendencia === 'baixa') {
          recomendacao = 'Preço em queda. Pode ser um bom momento para comprar.';
        } else if (precoMin < precoMedio * 0.9) {
          recomendacao = `Ótima oportunidade: há produtos com preço ${((1 - precoMin / precoMedio) * 100).toFixed(0)}% abaixo da média.`;
        } else {
          recomendacao = 'Preço estável. Compare com outras opções antes de decidir.';
        }

        return {
          id: `ap-${analise.produtoId}-${index}`,
          produtoId: analise.produtoId,
          produtoNome: analise.produtoNome,
          data: new Date().toISOString().split('T')[0], // Data atual no formato YYYY-MM-DD
          preco: precoMin, // Menor preço disponível
          precoMedio,
          precoMin,
          precoMax,
          tendencia,
          recomendacao,
          moeda: 'BRL',
        };
      });

    // Aplicar paginação
    const totalCount = todasAnalises.length;
    const analises = todasAnalises.slice(offset, offset + limit);

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] GET /api/produtos/analises-precos - Sucesso (${analises.length}/${totalCount} itens, ${duration}ms)`);

    // Retornar resposta no formato esperado
    return NextResponse.json({
      items: analises,
      count: analises.length,
      total: totalCount,
      offset,
      limit,
    }, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': `${duration}ms`,
      },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] GET /api/produtos/analises-precos - Erro:`, error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao buscar análises de preços',
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

