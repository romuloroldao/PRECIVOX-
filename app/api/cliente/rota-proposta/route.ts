import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TokenManager } from '@/lib/token-manager';
import type { ItemLista } from '@/app/context/ListaContext';
import type { PropostaRotaOtimizacao } from '@/lib/lista-rota-proposta';

export const dynamic = 'force-dynamic';

type LinhaEntrada = {
  lineId: string;
  estoqueId: string;
  mercadoId: string;
  unidadeId: string;
  quantidade: number;
};

function precoEfetivo(p: { preco: { toNumber(): number }; precoPromocional: { toNumber(): number } | null; emPromocao: boolean }) {
  if (p.emPromocao && p.precoPromocional) return p.precoPromocional.toNumber();
  return p.preco.toNumber();
}

function toItemLista(
  estoque: {
    id: string;
    preco: { toNumber(): number };
    precoPromocional: { toNumber(): number } | null;
    emPromocao: boolean;
    quantidade: number | null;
    produtos: {
      id: string;
      nome: string | null;
      categoria: string | null;
      marca: string | null;
      imagem: string | null;
    };
    unidades: {
      id: string;
      nome: string | null;
      mercados: { id: string; nome: string | null } | null;
    } | null;
  },
  quantidade: number
): ItemLista {
  const u = estoque.unidades;
  const mercadoRel = u?.mercados;
  const preco = estoque.preco.toNumber();
  const pp = estoque.precoPromocional?.toNumber() ?? undefined;
  return {
    id: `${estoque.id}-${u?.id ?? ''}`,
    estoqueId: estoque.id,
    produtoCatalogoId: estoque.produtos.id,
    nome: estoque.produtos.nome ?? 'Produto',
    preco,
    precoPromocional: pp,
    emPromocao: estoque.emPromocao || false,
    quantidade,
    categoria: estoque.produtos.categoria ?? undefined,
    marca: estoque.produtos.marca ?? undefined,
    imagem: estoque.produtos.imagem ?? undefined,
    unidade: {
      id: u?.id ?? '',
      nome: u?.nome ?? '',
      mercado: {
        id: mercadoRel?.id ?? '',
        nome: mercadoRel?.nome ?? '',
      },
    },
  };
}

/**
 * POST — Propõe consolidar compras no mercado âncora (maior subtotal) trocando itens de um mercado satélite
 * por equivalentes de mesma categoria no âncora, reduzindo o número de idas.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });
    if (!user || user.role !== 'CLIENTE') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = (await req.json()) as { itens?: LinhaEntrada[] };
    const linhas = Array.isArray(body.itens) ? body.itens : [];
    if (linhas.length < 2) {
      return NextResponse.json({ proposal: null as PropostaRotaOtimizacao | null });
    }

    const porMercado = new Map<string, LinhaEntrada[]>();
    for (const l of linhas) {
      if (!l.lineId || !l.estoqueId || !l.mercadoId) continue;
      const q = Math.max(1, Math.min(99, Number(l.quantidade) || 1));
      const arr = porMercado.get(l.mercadoId) ?? [];
      arr.push({ ...l, quantidade: q });
      porMercado.set(l.mercadoId, arr);
    }

    if (porMercado.size <= 1) {
      return NextResponse.json({ proposal: null as PropostaRotaOtimizacao | null });
    }

    const subPorMercado = new Map<string, number>();
    for (const [mid, ls] of porMercado) {
      let s = 0;
      for (const l of ls) {
        const e = await prisma.estoques.findUnique({
          where: { id: l.estoqueId },
          select: {
            preco: true,
            precoPromocional: true,
            emPromocao: true,
          },
        });
        if (!e) continue;
        const pe = precoEfetivo(e as Parameters<typeof precoEfetivo>[0]);
        s += pe * l.quantidade;
      }
      subPorMercado.set(mid, s);
    }

    let anchorId = '';
    let maxSub = -1;
    for (const [mid, s] of subPorMercado) {
      if (s > maxSub) {
        maxSub = s;
        anchorId = mid;
      }
    }

    const anchorNomeRow = await prisma.mercados.findFirst({
      where: { id: anchorId },
      select: { nome: true },
    });
    const anchorNome = anchorNomeRow?.nome ?? 'Mercado';

    const unidadesAnchor = await prisma.unidades.findMany({
      where: { mercadoId: anchorId, ativa: true },
      select: { id: true },
    });
    const uidsAnchor = unidadesAnchor.map((u) => u.id);
    if (uidsAnchor.length === 0) {
      return NextResponse.json({ proposal: null as PropostaRotaOtimizacao | null });
    }

    const satelites = [...porMercado.keys()]
      .filter((m) => m !== anchorId)
      .sort((a, b) => (subPorMercado.get(a) ?? 0) - (subPorMercado.get(b) ?? 0));

    const listaTotal = [...subPorMercado.values()].reduce((a, b) => a + b, 0);

    for (const satId of satelites) {
      const grupo = porMercado.get(satId);
      if (!grupo?.length) continue;

      const movimentos: PropostaRotaOtimizacao['movimentos'] = [];
      let deltaTotal = 0;
      let ok = true;

      const satNomeRow = await prisma.mercados.findFirst({
        where: { id: satId },
        select: { nome: true },
      });
      const sateliteNome = satNomeRow?.nome ?? 'Outro mercado';

      for (const linha of grupo) {
        const orig = await prisma.estoques.findUnique({
          where: { id: linha.estoqueId },
          include: {
            produtos: { select: { id: true, nome: true, categoria: true } },
            unidades: { include: { mercados: true } },
          },
        });
        if (!orig?.produtos?.categoria?.trim()) {
          ok = false;
          break;
        }

        const cat = orig.produtos.categoria.trim();
        const precoAnt = precoEfetivo(orig) * linha.quantidade;

        const alt = await prisma.estoques.findFirst({
          where: {
            unidadeId: { in: uidsAnchor },
            quantidade: { gt: 0 },
            produtos: {
              categoria: cat,
              ativo: true,
            },
          },
          orderBy: [{ emPromocao: 'desc' }, { preco: 'asc' }],
          include: {
            produtos: true,
            unidades: { include: { mercados: true } },
          },
        });

        if (!alt) {
          ok = false;
          break;
        }

        const precoNv = precoEfetivo(alt) * linha.quantidade;
        deltaTotal += precoNv - precoAnt;

        const itemLista = toItemLista(alt, linha.quantidade);

        movimentos.push({
          removerLineId: linha.lineId,
          nomeAnterior: orig.produtos.nome ?? 'Item',
          nomeNovo: alt.produtos.nome ?? 'Substituto',
          precoAnterior: precoAnt,
          precoNovo: precoNv,
          itemLista,
        });
      }

      if (!ok || movimentos.length === 0) continue;

      if (listaTotal > 0 && deltaTotal > listaTotal * 0.22) {
        continue;
      }

      const out: PropostaRotaOtimizacao = {
        movimentos,
        resumo: {
          mercadosAntes: porMercado.size,
          mercadosDepois: porMercado.size - 1,
          deltaTotal: Math.round(deltaTotal * 100) / 100,
          anchorNome,
          sateliteNome,
        },
      };

      return NextResponse.json({ proposal: out });
    }

    return NextResponse.json({ proposal: null as PropostaRotaOtimizacao | null });
  } catch (e) {
    console.error('[POST /api/cliente/rota-proposta]', e);
    return NextResponse.json({ error: 'Erro ao montar proposta' }, { status: 500 });
  }
}
