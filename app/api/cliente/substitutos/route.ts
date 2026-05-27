import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TokenManager } from '@/lib/token-manager';
import { jaccardTokensDeNomes } from '@/lib/produtos-nome-normalize';
import { enriquecerSubstitutos, type SubstitutoBase } from '@/lib/troca-inteligente';

export const dynamic = 'force-dynamic';

function rowFromProduto(produto: {
  id: string;
  nome: string | null;
  categoria: string | null;
  marca: string | null;
  imagem: string | null;
  estoques: Array<{
    id: string;
    preco: { toNumber(): number } | null;
    precoPromocional: { toNumber(): number } | null;
    emPromocao: boolean;
    quantidade: number | null;
    unidades: {
      id: string;
      nome: string | null;
      endereco: string | null;
      cidade: string | null;
      estado: string | null;
      mercados: { id: string; nome: string | null } | null;
    } | null;
  }>;
}) {
  const estoque = produto.estoques[0];
  const unidade = estoque?.unidades;
  const mercadoRel = unidade?.mercados;
  return {
    id: estoque?.id ?? `produto-${produto.id}`,
    nome: produto.nome ?? 'Produto',
    preco: estoque?.preco?.toNumber() ?? 0,
    precoPromocional: estoque?.precoPromocional?.toNumber() ?? null,
    emPromocao: estoque?.emPromocao || false,
    disponivel: estoque ? (estoque.quantidade ?? 0) > 0 : false,
    quantidade: estoque?.quantidade ?? 0,
    categoria: produto.categoria,
    marca: produto.marca,
    imagem: produto.imagem,
    unidade: {
      id: unidade?.id ?? 'sem-unidade',
      nome: unidade?.nome ?? 'Sem unidade',
      endereco: unidade?.endereco ?? '',
      cidade: unidade?.cidade ?? '',
      estado: unidade?.estado ?? '',
      mercado: {
        id: mercadoRel?.id ?? 'sem-mercado',
        nome: mercadoRel?.nome ?? 'Sem mercado',
      },
    },
    produto,
  };
}

/**
 * GET — Substitutos na mesma categoria ou equivalentes (chave / tokens).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });
    if (!user || user.role !== 'CLIENTE') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const mercadoId = searchParams.get('mercadoId')?.trim() || '';
    const produtoId = searchParams.get('produtoId')?.trim() || '';
    const unidadeId = searchParams.get('unidadeId')?.trim() || '';
    const modo = (searchParams.get('modo') || 'categoria') as 'categoria' | 'equivalente';

    if (!mercadoId || !produtoId) {
      return NextResponse.json({ error: 'mercadoId e produtoId obrigatórios' }, { status: 400 });
    }

    const orig = await prisma.produtos.findFirst({
      where: { id: produtoId, ativo: true },
      select: {
        id: true,
        nome: true,
        categoria: true,
        marca: true,
        chaveInsight: true,
        estoques: {
          where: {
            ...(unidadeId ? { unidadeId } : {}),
            unidades: { mercadoId },
            quantidade: { gt: 0 },
          },
          take: 1,
          orderBy: [{ emPromocao: 'desc' }, { preco: 'asc' }],
          select: { preco: true, precoPromocional: true, emPromocao: true },
        },
      },
    });
    if (!orig) {
      return NextResponse.json({ substitutos: [], modo });
    }

    const estOrig = orig.estoques[0];
    const origemBase: SubstitutoBase = {
      produtoId: orig.id,
      nome: orig.nome ?? 'Produto',
      preco: estOrig?.preco.toNumber() ?? 0,
      precoPromocional: estOrig?.precoPromocional?.toNumber() ?? null,
      emPromocao: estOrig?.emPromocao ?? false,
      categoria: orig.categoria,
      marca: orig.marca,
    };

    async function responderComEnriquecimento(
      rows: Parameters<typeof rowFromProduto>[0][]
    ) {
      const bases: SubstitutoBase[] = rows.map((r) => {
        const e = r.estoques[0];
        return {
          produtoId: r.id,
          nome: r.nome ?? 'Produto',
          preco: e?.preco?.toNumber() ?? 0,
          precoPromocional: e?.precoPromocional?.toNumber() ?? null,
          emPromocao: e?.emPromocao ?? false,
          categoria: r.categoria,
          marca: r.marca,
        };
      });
      const enriquecidos = await enriquecerSubstitutos(
        user.id,
        mercadoId,
        origemBase,
        bases,
        modo
      );
      const porId = new Map(enriquecidos.map((x) => [x.produtoId, x]));
      const substitutos = rows
        .map((r) => {
          const row = rowFromProduto(r);
          const ex = porId.get(r.id);
          if (!ex) return row;
          return {
            ...row,
            produtoCatalogoId: r.id,
            explicacao: ex.explicacao,
            motivos: ex.motivos,
            economiaVsOrigem: ex.economiaVsOrigem,
            economiaPct: ex.economiaPct,
            scorePessoal: ex.scorePessoal,
            aceitesUsuario: ex.aceitesUsuario,
            aceitesBairro: ex.aceitesBairro,
          };
        })
        .sort(
          (a, b) =>
            ((b as { scorePessoal?: number }).scorePessoal ?? 0) -
            ((a as { scorePessoal?: number }).scorePessoal ?? 0)
        );
      return NextResponse.json({ substitutos, modo, origem: origemBase });
    }

    const estoqueBase: Record<string, unknown> = {
      unidades: { mercadoId },
      quantidade: { gt: 0 },
    };
    if (unidadeId) {
      (estoqueBase.unidades as Record<string, unknown>).id = unidadeId;
    }

    if (modo === 'categoria' && orig.categoria) {
      const rows = await prisma.produtos.findMany({
        where: {
          id: { not: orig.id },
          ativo: true,
          categoria: orig.categoria,
          estoques: { some: estoqueBase as never },
        },
        take: 12,
        orderBy: { nome: 'asc' },
        select: {
          id: true,
          nome: true,
          categoria: true,
          marca: true,
          imagem: true,
          estoques: {
            where: estoqueBase,
            take: 1,
            orderBy: [{ emPromocao: 'desc' }, { preco: 'asc' }],
            include: {
              unidades: { include: { mercados: true } },
            },
          },
        },
      });
      const filtrados = rows.filter((r) => r.estoques.length > 0);
      return responderComEnriquecimento(filtrados as Parameters<typeof rowFromProduto>[0][]);
    }

    const fromInsight = orig.chaveInsight
      ? await prisma.produtos.findMany({
          where: {
            chaveInsight: orig.chaveInsight,
            id: { not: orig.id },
            ativo: true,
            estoques: { some: estoqueBase as never },
          },
          take: 8,
          select: {
            id: true,
            nome: true,
            categoria: true,
            marca: true,
            imagem: true,
            estoques: {
              where: estoqueBase,
              take: 1,
              orderBy: [{ emPromocao: 'desc' }, { preco: 'asc' }],
              include: {
                unidades: { include: { mercados: true } },
              },
            },
          },
        })
      : [];

    let candidatos = fromInsight;
    if (candidatos.length < 4 && orig.nome) {
      const loose = await prisma.produtos.findMany({
        where: {
          id: { not: orig.id },
          ativo: true,
          estoques: { some: estoqueBase as never },
          OR: [
            { marca: { contains: orig.nome.slice(0, 20), mode: 'insensitive' } },
            { nome: { contains: orig.nome.slice(0, 24), mode: 'insensitive' } },
          ],
        },
        take: 24,
        select: {
          id: true,
          nome: true,
          categoria: true,
          marca: true,
          imagem: true,
          estoques: {
            where: estoqueBase,
            take: 1,
            orderBy: [{ emPromocao: 'desc' }, { preco: 'asc' }],
            include: {
              unidades: { include: { mercados: true } },
            },
          },
        },
      });
      const seen = new Set(candidatos.map((c) => c.id));
      for (const l of loose) {
        if (!seen.has(l.id) && l.estoques.length > 0) {
          candidatos.push(l);
          seen.add(l.id);
        }
      }
    }

    const nomeOrig = orig.nome ?? '';
    const scored = candidatos
      .filter((c) => c.estoques.length > 0)
      .map((c) => ({
        c,
        score: jaccardTokensDeNomes(nomeOrig, c.nome ?? ''),
      }))
      .filter((x) => x.score >= 0.12)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const filtrados = scored.map((s) => s.c as Parameters<typeof rowFromProduto>[0]);
    return responderComEnriquecimento(filtrados);
  } catch (e) {
    console.error('[GET /api/cliente/substitutos]', e);
    return NextResponse.json({ error: 'Erro ao buscar substitutos' }, { status: 500 });
  }
}
