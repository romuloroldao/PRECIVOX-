import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  calcularRota,
  calcularScoreCustoBeneficio,
  COORDENADAS_PADRAO,
  type Coordenadas,
  type RotaInfo,
  type ScoreCustoBeneficio
} from '@/lib/geolocation';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface MelhorOferta {
  preco: number;
  economia: number;
  mercado: {
    id: string;
    nome: string;
  };
  unidade: {
    id: string;
    nome: string;
    endereco: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  rota?: RotaInfo;
  score?: ScoreCustoBeneficio;
}

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
  melhorOferta?: MelhorOferta;
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
            nome: true,
            endereco: true,
            latitude: true,
            longitude: true,
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
      estoques: typeof estoques;
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
          estoques: [],
        });
      }

      const analise = analisesPorProduto.get(produtoId)!;
      const preco = Number(estoque.preco);

      analise.precos.push(preco);
      analise.atualizacoes.push(estoque.atualizadoEm);
      analise.estoques.push(estoque);

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

        // Encontrar a melhor oferta (menor preço) com informações de rota
        let melhorOferta: MelhorOferta | undefined;

        if (analise.estoques.length > 0) {
          // Encontrar o estoque com menor preço
          const estoqueComMelhorPreco = analise.estoques.reduce((melhor, estoque) => {
            const precoAtual = estoque.emPromocao && estoque.precoPromocional
              ? Number(estoque.precoPromocional)
              : Number(estoque.preco);

            const precoMelhor = melhor.emPromocao && melhor.precoPromocional
              ? Number(melhor.precoPromocional)
              : Number(melhor.preco);

            return precoAtual < precoMelhor ? estoque : melhor;
          });

          const precoMelhorOferta = estoqueComMelhorPreco.emPromocao && estoqueComMelhorPreco.precoPromocional
            ? Number(estoqueComMelhorPreco.precoPromocional)
            : Number(estoqueComMelhorPreco.preco);

          const economia = precoMedio - precoMelhorOferta;

          // Calcular rota se houver coordenadas
          let rota: RotaInfo | undefined;
          let score: ScoreCustoBeneficio | undefined;

          if (estoqueComMelhorPreco.unidades?.latitude && estoqueComMelhorPreco.unidades?.longitude) {
            // Obter coordenadas do usuário dos query params ou usar padrão
            const userLat = searchParams.get('lat');
            const userLng = searchParams.get('lng');

            let origem: Coordenadas = COORDENADAS_PADRAO;

            if (userLat && userLng) {
              const lat = parseFloat(userLat);
              const lng = parseFloat(userLng);
              if (!isNaN(lat) && !isNaN(lng)) {
                origem = { latitude: lat, longitude: lng };
              }
            }

            const destino: Coordenadas = {
              latitude: estoqueComMelhorPreco.unidades.latitude,
              longitude: estoqueComMelhorPreco.unidades.longitude,
            };

            rota = calcularRota(origem, destino, economia);
            score = calcularScoreCustoBeneficio(
              economia,
              precoMedio,
              rota.distanciaKm,
              rota.tempoEstimadoMin,
              estoqueComMelhorPreco.disponivel
            );
          }

          melhorOferta = {
            preco: precoMelhorOferta,
            economia,
            mercado: {
              id: estoqueComMelhorPreco.unidades?.mercados?.id || '',
              nome: estoqueComMelhorPreco.unidades?.mercados?.nome || 'Mercado',
            },
            unidade: {
              id: estoqueComMelhorPreco.unidades?.id || '',
              nome: estoqueComMelhorPreco.unidades?.nome || 'Unidade',
              endereco: estoqueComMelhorPreco.unidades?.endereco || null,
              latitude: estoqueComMelhorPreco.unidades?.latitude || null,
              longitude: estoqueComMelhorPreco.unidades?.longitude || null,
            },
            rota,
            score,
          };
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
          melhorOferta,
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

