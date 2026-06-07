import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TokenManager } from '@/lib/token-manager';
import { EventCollector } from '@/lib/ai/event-collector';
import {
  buildProdutoWhereFromBuscaParams,
  buscaParamsFromSearchParams,
  whereProdutoComMercado,
} from '@/lib/produtos-busca-where';
import { getPrecoReferenciaRegionalParaProduto } from '@/lib/ai/conversao-metrics';
import { buscarMelhorAlternativa } from '@/lib/melhor-alternativa-preco';
import { getProvaSocialBatch } from '@/lib/prova-social-hiperlocal';
import {
  buildEstoqueWhereComparativo,
  formatarOfertaComparativa,
} from '@/lib/produtos-busca-comparativo';
import {
  CAP_RANKING,
  ordenarPorRankingHibrido,
  paginarRankingHibrido,
} from '@/lib/ranking-busca-hibrido';
import {
  calcularPerfilPreciDeEventos,
  mesclarComAjustes,
  type PerfilPreciAjustes,
  type PerfilPreciScores,
} from '@/lib/perfil-preci';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

async function registrarBuscasSemResultadoPorMercado(
  request: NextRequest,
  buscaTrim: string,
  page: number,
  baseWhere: Record<string, unknown>,
  estoqueFilter: Record<string, unknown>,
  mercadoFiltroUrl: string | null
): Promise<void> {
  if (page !== 1 || buscaTrim.length < 2) return;

  const user = await TokenManager.validateSession({
    headers: request.headers,
    cookies: request.cookies,
  });
  if (!user || user.id === 'anonymous') return;

  const termo = buscaTrim.slice(0, 200);

  const registrarSeZero = async (mercadoId: string) => {
    const whereM = whereProdutoComMercado(baseWhere, estoqueFilter, mercadoId);
    const count = await prisma.produtos.count({ where: whereM });
    if (count === 0) {
      await EventCollector.recordEvent(user.id, mercadoId, 'produto_buscado', {
        searchQuery: termo,
        resultados: 0,
      });
    }
  };

  if (mercadoFiltroUrl) {
    await registrarSeZero(mercadoFiltroUrl);
    return;
  }

  const mercados = await prisma.mercados.findMany({
    where: { ativo: true },
    select: { id: true },
  });

  await Promise.all(mercados.map((m) => registrarSeZero(m.id)));
}

async function scoresPreciParaRanking(request: NextRequest): Promise<PerfilPreciScores | null> {
  const user = await TokenManager.validateSession({
    headers: request.headers,
    cookies: request.cookies,
  });
  if (!user?.id || user.id === 'anonymous') return null;

  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 30);

  const [eventos, dbUser] = await Promise.all([
    EventCollector.getUserEventsGlobal(user.id, inicio, fim),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { perfilPreci: true },
    }),
  ]);

  const calculado = calcularPerfilPreciDeEventos(eventos);
  const ajustes =
    (dbUser?.perfilPreci as { ajustes?: PerfilPreciAjustes } | null)?.ajustes ?? null;
  return mesclarComAjustes(calculado.scores, ajustes);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10), 1), 100);
    const skip = (page - 1) * limit;

    const params = buscaParamsFromSearchParams(searchParams);
    const modoComparativo = searchParams.get('modoComparativo') === 'true';
    const sessionUser = await TokenManager.validateSession({
      headers: request.headers,
      cookies: request.cookies,
    });
    const ordenacaoParam = searchParams.get('ordenacao');
    const ordenacao =
      ordenacaoParam ||
      (sessionUser?.id && sessionUser.id !== 'anonymous' ? 'hibrido' : 'nome');
    const usarHibrido = ordenacao === 'hibrido';
    const { whereProduct, estoqueFilter, hasEstoqueWhere } = buildProdutoWhereFromBuscaParams(params);
    const busca = params.busca?.trim() || '';

    if (busca.length >= 2) {
      void registrarBuscasSemResultadoPorMercado(
        request,
        busca,
        page,
        whereProduct,
        estoqueFilter,
        params.mercado
      ).catch(() => {});
    }

    if (modoComparativo) {
      const whereEstoque = buildEstoqueWhereComparativo(params);
      const totalOfertas = await prisma.estoques.count({ where: whereEstoque });
      const poolTake = usarHibrido ? Math.min(CAP_RANKING, totalOfertas) : limit;
      const poolSkip = usarHibrido ? 0 : skip;

      const estoques = await prisma.estoques.findMany({
        where: whereEstoque,
        skip: poolSkip,
        take: poolTake,
        orderBy: [
          { produtos: { nome: 'asc' } },
          { preco: 'asc' },
          { atualizadoEm: 'desc' },
        ],
        include: {
          produtos: true,
          unidades: { include: { mercados: true } },
        },
      });

      let produtosFormatados = estoques.map(formatarOfertaComparativa);

      if (usarHibrido && produtosFormatados.length > 0) {
        const scores = await scoresPreciParaRanking(request);
        produtosFormatados = paginarRankingHibrido(
          ordenarPorRankingHibrido(produtosFormatados, scores),
          page,
          limit
        );
      }

      const includeProvaSocial =
        request.nextUrl.searchParams.get('includeProvaSocial') === 'true' && params.mercado;

      let dataOut = produtosFormatados;
      if (includeProvaSocial && params.mercado) {
        const cap = 36;
        const head = produtosFormatados.slice(0, cap);
        const tail = produtosFormatados.slice(cap);
        const pids = head
          .map((row) => row.produto.id)
          .filter((id): id is string => Boolean(id));
        const provaMap = await getProvaSocialBatch(params.mercado, pids);
        const enriched = head.map((row) => {
          const prova = provaMap.get(row.produto.id);
          return prova ? { ...row, provaSocial: prova } : row;
        });
        dataOut = [...enriched, ...tail];
      }

      return NextResponse.json(
        {
          success: true,
          data: dataOut,
          modoComparativo: true,
          ordenacao: usarHibrido ? 'hibrido' : ordenacao,
          pagination: {
            page,
            limit,
            total: totalOfertas,
            totalPages: Math.ceil(totalOfertas / limit),
            hasMore: skip + produtosFormatados.length < totalOfertas,
          },
        },
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const total = await prisma.produtos.count({ where: whereProduct });
    const poolTake = usarHibrido ? Math.min(CAP_RANKING, total) : limit;
    const poolSkip = usarHibrido ? 0 : skip;

    const produtos = await prisma.produtos.findMany({
      where: whereProduct,
      skip: poolSkip,
      take: poolTake,
      orderBy: [{ nome: 'asc' }, { dataAtualizacao: 'desc' }],
      include: {
        estoques: {
          ...(hasEstoqueWhere ? { where: estoqueFilter } : {}),
          orderBy: [{ emPromocao: 'desc' }, { preco: 'asc' }, { atualizadoEm: 'desc' }],
          take: 1,
          include: {
            unidades: {
              include: {
                mercados: true,
              },
            },
          },
        },
      },
    });

    let produtosFormatados = produtos.map((produto) => {
      const estoque = produto.estoques[0];
      const unidade = estoque?.unidades;
      const mercadoRel = unidade?.mercados;

      const precoEfetivo =
        estoque?.emPromocao && estoque.precoPromocional
          ? estoque.precoPromocional.toNumber()
          : estoque?.preco?.toNumber() ?? 0;

      return {
        id: estoque?.id ?? `produto-${produto.id}`,
        nome: produto.nome ?? 'Produto',
        preco: estoque?.preco?.toNumber() ?? 0,
        precoPromocional: estoque?.precoPromocional?.toNumber() ?? null,
        precoEfetivo,
        emPromocao: estoque?.emPromocao || false,
        disponivel: estoque ? (estoque.quantidade ?? 0) > 0 : false,
        quantidade: estoque?.quantidade ?? 0,
        categoria: produto.categoria,
        marca: produto.marca,
        imagem: produto.imagem,
        truth: estoque
          ? {
              fonte: estoque.fonte ?? 'UPLOAD_GESTOR',
              confianca: estoque.confianca ?? 70,
              verificadoEm: estoque.verificadoEm?.toISOString() ?? null,
              atualizadoEm: estoque.atualizadoEm.toISOString(),
            }
          : null,
        unidade: {
          id: unidade?.id ?? 'sem-unidade',
          nome: unidade?.nome ?? 'Sem unidade',
          endereco: unidade?.endereco ?? '',
          cidade: unidade?.cidade ?? '',
          estado: unidade?.estado ?? '',
          latitude: unidade?.latitude ?? null,
          longitude: unidade?.longitude ?? null,
          mercado: {
            id: mercadoRel?.id ?? 'sem-mercado',
            nome: mercadoRel?.nome ?? 'Sem mercado',
          },
        },
        produto,
      };
    });

    if (usarHibrido && produtosFormatados.length > 0) {
      const scores = await scoresPreciParaRanking(request);
      produtosFormatados = paginarRankingHibrido(
        ordenarPorRankingHibrido(produtosFormatados, scores),
        page,
        limit
      );
    }

    const includeRef =
      request.nextUrl.searchParams.get('includeReferencia') === 'true' && params.mercado;
    const includeEconomia = request.nextUrl.searchParams.get('includeEconomia') === 'true';
    const includeProvaSocial = request.nextUrl.searchParams.get('includeProvaSocial') === 'true';
    const mercadoRef = params.mercado;

    let dataOut = produtosFormatados;
    const cap = 36;

    if (includeRef && mercadoRef) {
      const head = produtosFormatados.slice(0, cap);
      const tail = produtosFormatados.slice(cap);
      const enriched = await Promise.all(
        head.map(async (row) => {
          const pid = (row.produto as { id?: string })?.id;
          const preco = row.precoEfetivo ?? row.preco;
          if (!pid || preco <= 0) {
            return { ...row, referenciaRegiao: null as { media: number; diferencaPct: number | null } | null };
          }
          const ref = await getPrecoReferenciaRegionalParaProduto(mercadoRef, pid, preco, 'ampla', 25);
          return {
            ...row,
            referenciaRegiao:
              ref.media != null
                ? { media: ref.media, diferencaPct: ref.diferencaPct }
                : null,
          };
        })
      );
      dataOut = [...enriched, ...tail];
    }

    if (includeEconomia) {
      const sessionUser = await TokenManager.validateSession({
        headers: request.headers,
        cookies: request.cookies,
      });
      const userId =
        sessionUser?.id && sessionUser.id !== 'anonymous' ? sessionUser.id : undefined;

      const head = dataOut.slice(0, cap);
      const tail = dataOut.slice(cap);
      const enriched = await Promise.all(
        head.map(async (row) => {
          const pid = (row.produto as { id?: string })?.id;
          const uid = row.unidade?.id;
          const preco = row.precoEfetivo ?? row.preco;
          if (!pid || !uid || preco <= 0) {
            return { ...row, melhorAlternativa: null };
          }
          try {
            const alt = await buscarMelhorAlternativa(pid, uid, preco, userId);
            if (!alt) return { ...row, melhorAlternativa: null };
            return {
              ...row,
              melhorAlternativa: {
                mercadoNome: alt.unidade.mercado.nome,
                unidadeNome: alt.unidade.nome,
                precoEfetivo:
                  alt.emPromocao && alt.precoPromocional != null
                    ? alt.precoPromocional
                    : alt.preco,
                distanciaKm: alt.distanciaKm,
                economiaLiquida: {
                  economiaBruta: alt.economiaLiquida.economiaBruta,
                  economiaLiquida: alt.economiaLiquida.economiaLiquida,
                  recomendacao: alt.economiaLiquida.recomendacao,
                  explicacao: alt.economiaLiquida.explicacao,
                  tempoMinutos: alt.economiaLiquida.tempoMinutos,
                },
              },
            };
          } catch {
            return { ...row, melhorAlternativa: null };
          }
        })
      );
      dataOut = [...enriched, ...tail];
    }

    if (includeProvaSocial && mercadoRef) {
      const head = dataOut.slice(0, cap);
      const tail = dataOut.slice(cap);
      const pids = head
        .map((row) => (row.produto as { id?: string })?.id)
        .filter((id): id is string => Boolean(id));
      const provaMap = await getProvaSocialBatch(mercadoRef, pids);
      const enriched = head.map((row) => {
        const pid = (row.produto as { id?: string })?.id;
        const prova = pid ? provaMap.get(pid) : undefined;
        return prova ? { ...row, provaSocial: prova } : row;
      });
      dataOut = [...enriched, ...tail];
    }

    return NextResponse.json(
      {
        success: true,
        data: dataOut,
        ordenacao: usarHibrido ? 'hibrido' : ordenacao,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + produtosFormatados.length < total,
        },
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Erro ao buscar produtos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno ao buscar produtos',
        message: err?.message || 'Erro desconhecido',
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
