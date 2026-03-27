import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TokenManager } from '@/lib/token-manager';
import {
  jaccardTokensDeNomes,
  normalizeTermoBuscaChave,
} from '@/lib/produtos-nome-normalize';
import { resolveProdutoCatalogoIdFromMeta } from '@/lib/ai/conversao-metrics';

export const dynamic = 'force-dynamic';

function mapProdutoToBuscaShape(produto: {
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

/** Equivalentes quando a busca literal falha: tokens + nome_chave + similaridade de tokens. */
async function equivalentesParaBusca(mercadoId: string, buscaRaw: string) {
  const busca = buscaRaw.trim();
  if (busca.length < 2) return [];

  const key = normalizeTermoBuscaChave(busca);
  const tokens = key.split(/\s+/).filter((t) => t.length >= 2).slice(0, 5);
  if (tokens.length === 0) return [];

  const estoqueBase = {
    unidades: { mercadoId },
    quantidade: { gt: 0 },
  };

  const candidatos = await prisma.produtos.findMany({
    where: {
      ativo: true,
      estoques: { some: estoqueBase },
      OR: [
        ...tokens.map((t) => ({ nomeChave: { contains: t, mode: 'insensitive' as const } })),
        { nome: { contains: busca.slice(0, 80), mode: 'insensitive' } },
      ],
    },
    take: 80,
    select: {
      id: true,
      nome: true,
      nomeChave: true,
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

  const scored = candidatos
    .map((p) => {
      const nome = p.nome ?? '';
      const j = jaccardTokensDeNomes(busca, nome);
      const nk = p.nomeChave ?? '';
      const keyOverlap = key && nk ? (key.split(/\s+/).every((t) => nk.includes(t)) ? 0.15 : 0) : 0;
      return { p, score: j + keyOverlap };
    })
    .filter((x) => x.score >= 0.22 || jaccardTokensDeNomes(busca, x.p.nome ?? '') >= 0.18)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  return scored.map((s) => mapProdutoToBuscaShape(s.p as Parameters<typeof mapProdutoToBuscaShape>[0]));
}

/** Termos com volume na busca (intenção) no mercado — exclui sem resultado. */
async function termosIntencao(mercadoId: string, dias: number, limite: number) {
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - dias);

  const rows = await prisma.userEvent.findMany({
    where: {
      mercadoId,
      type: 'produto_buscado',
      timestamp: { gte: inicio },
    },
    select: { metadata: true },
    take: 8000,
  });

  const map = new Map<string, number>();
  for (const r of rows) {
    const meta = r.metadata as Record<string, unknown> | null;
    if (!meta) continue;
    const res = meta.resultados;
    if (res === 0 || res === '0') continue;
    const q = meta.searchQuery;
    if (typeof q !== 'string' || q.trim().length < 2) continue;
    const k = q.trim().toLowerCase().slice(0, 120);
    map.set(k, (map.get(k) ?? 0) + 1);
  }

  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([termo, ocorrencias]) => ({ termo, ocorrencias }));
}

/** Produtos com boa retenção na lista (baixa taxa remoção/adição). */
async function produtosBoaRetencao(mercadoId: string, dias: number, limite: number) {
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - dias);

  const [adds, removes] = await Promise.all([
    prisma.userEvent.findMany({
      where: {
        mercadoId,
        type: 'produto_adicionado_lista',
        timestamp: { gte: inicio },
      },
      select: { metadata: true },
      take: 12000,
    }),
    prisma.userEvent.findMany({
      where: {
        mercadoId,
        type: 'produto_removido_lista',
        timestamp: { gte: inicio },
      },
      select: { metadata: true },
      take: 12000,
    }),
  ]);

  const addCounts = new Map<string, number>();
  for (const e of adds) {
    const meta = e.metadata as Record<string, unknown> | null;
    if (!meta) continue;
    const id = await resolveProdutoCatalogoIdFromMeta(meta);
    if (!id) continue;
    addCounts.set(id, (addCounts.get(id) ?? 0) + 1);
  }

  const removeCounts = new Map<string, number>();
  for (const e of removes) {
    const meta = e.metadata as Record<string, unknown> | null;
    if (!meta) continue;
    const id = await resolveProdutoCatalogoIdFromMeta(meta);
    if (!id) continue;
    removeCounts.set(id, (removeCounts.get(id) ?? 0) + 1);
  }

  const candidatos = [...addCounts.entries()]
    .map(([produtoId, adicoes]) => {
      const remocoes = removeCounts.get(produtoId) ?? 0;
      const taxa = adicoes > 0 ? remocoes / adicoes : 1;
      return { produtoId, adicoes, remocoes, taxa };
    })
    .filter((x) => x.adicoes >= 2 && x.taxa <= 0.35)
    .sort((a, b) => a.taxa - b.taxa || b.adicoes - a.adicoes)
    .slice(0, limite * 2);

  if (candidatos.length === 0) return [];

  const ids = candidatos.map((c) => c.produtoId);
  const estoqueBase = {
    unidades: { mercadoId },
    quantidade: { gt: 0 },
  };

  const produtos = await prisma.produtos.findMany({
    where: { id: { in: ids }, ativo: true, estoques: { some: estoqueBase } },
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

  const porId = new Map(produtos.map((p) => [p.id, p]));
  const out: ReturnType<typeof mapProdutoToBuscaShape>[] = [];
  for (const c of candidatos) {
    const p = porId.get(c.produtoId);
    if (!p?.estoques?.length) continue;
    out.push(mapProdutoToBuscaShape(p as Parameters<typeof mapProdutoToBuscaShape>[0]));
    if (out.length >= limite) break;
  }
  return out;
}

/**
 * GET — Sugestões para lista: equivalentes (busca vazia), termos quentes, produtos com boa retenção.
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
    if (!mercadoId) {
      return NextResponse.json({ error: 'mercadoId obrigatório' }, { status: 400 });
    }

    const m = await prisma.mercados.findFirst({
      where: { id: mercadoId, ativo: true },
      select: { id: true },
    });
    if (!m) {
      return NextResponse.json({ error: 'Mercado inválido' }, { status: 400 });
    }

    const busca = searchParams.get('busca')?.trim() || '';
    const excludeIds = new Set(
      (searchParams.get('excludeIds') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );

    let equivalentes: ReturnType<typeof mapProdutoToBuscaShape>[] = [];
    if (busca.length >= 2) {
      equivalentes = await equivalentesParaBusca(mercadoId, busca);
    }

    const filtrar = <T extends { produto?: { id?: string } }>(rows: T[]) =>
      rows.filter((r) => {
        const id = r.produto && typeof r.produto === 'object' && 'id' in r.produto ? (r.produto as { id: string }).id : '';
        return !id || !excludeIds.has(id);
      });

    const [termos, retencao] = await Promise.all([
      termosIntencao(mercadoId, 30, 8),
      produtosBoaRetencao(mercadoId, 30, 8),
    ]);

    return NextResponse.json({
      equivalentes: filtrar(equivalentes),
      termosIntencao: termos,
      produtosRetencao: filtrar(retencao),
    });
  } catch (e) {
    console.error('[GET /api/cliente/sugestoes-lista]', e);
    return NextResponse.json({ error: 'Erro ao montar sugestões' }, { status: 500 });
  }
}
