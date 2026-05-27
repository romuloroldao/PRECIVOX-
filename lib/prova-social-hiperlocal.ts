/**
 * Prova social hiperlocal anônima — Épico 8.3
 * Contagens agregadas por mercado, sem identificar usuários.
 */

import { prisma } from '@/lib/prisma';

export const PROVA_SOCIAL_MIN_FAMILIAS = 3;
export const PROVA_SOCIAL_PERIODO_DIAS = 30;

export type ProvaSocialContexto = 'lista' | 'compra' | 'troca' | 'popular';

export type ProvaSocialProduto = {
  produtoId: string;
  familiasUnicas: number;
  mensagem: string;
  contexto: ProvaSocialContexto;
  periodoDias: number;
};

export type ProvaSocialMercadoResumo = {
  mercadoId: string;
  regiaoLabel: string;
  familiasAtivasMercado: number;
  periodoDias: number;
  destaques: ProvaSocialProduto[];
  mensagemGeral: string;
};

function labelRegiao(bairro: string | null | undefined, cidade: string | null | undefined): string {
  if (bairro?.trim()) return bairro.trim();
  if (cidade?.trim()) return cidade.trim();
  return 'sua região';
}

/** Arredonda para baixo em degraus (privacidade + copy natural). */
export function formatarContagemFamilias(n: number): string {
  if (n < PROVA_SOCIAL_MIN_FAMILIAS) return '';
  if (n < 8) return `${n} famílias`;
  if (n < 20) return `${Math.floor(n / 5) * 5}+ famílias`;
  if (n < 50) return `${Math.floor(n / 10) * 10}+ famílias`;
  return '50+ famílias';
}

function montarMensagem(
  n: number,
  regiao: string,
  contexto: ProvaSocialContexto,
  dias: number
): string {
  const contagem = formatarContagemFamilias(n);
  if (!contagem) return '';

  switch (contexto) {
    case 'lista':
      return `${contagem} de ${regiao} colocaram na lista nos últimos ${dias} dias`;
    case 'compra':
      return `${contagem} de ${regiao} confirmaram compra deste item recentemente`;
    case 'troca':
      return `${contagem} de ${regiao} trocaram por este produto no mercado`;
    default:
      return `${contagem} de ${regiao} interagiram com este item no PRECIVOX`;
  }
}

async function labelRegiaoMercado(mercadoId: string): Promise<string> {
  const u = await prisma.unidades.findFirst({
    where: { mercadoId, ativa: true },
    select: { bairro: true, cidade: true },
    orderBy: { dataAtualizacao: 'desc' },
  });
  return labelRegiao(u?.bairro, u?.cidade);
}

type AgregadoProduto = {
  listas: Set<string>;
  compras: Set<string>;
  trocas: Set<string>;
};

async function agregarPorProduto(
  mercadoId: string,
  dias: number
): Promise<{ porProduto: Map<string, AgregadoProduto>; usuariosMercado: Set<string> }> {
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const eventos = await prisma.userEvent.findMany({
    where: {
      mercadoId,
      timestamp: { gte: desde },
      type: {
        in: [
          'produto_adicionado_lista',
          'compra_confirmada',
          'compra_realizada',
          'produto_substituicao_aceita',
        ],
      },
    },
    select: { type: true, userId: true, metadata: true },
  });

  const porProduto = new Map<string, AgregadoProduto>();
  const usuariosMercado = new Set<string>();

  const row = (pid: string): AgregadoProduto => {
    if (!porProduto.has(pid)) {
      porProduto.set(pid, { listas: new Set(), compras: new Set(), trocas: new Set() });
    }
    return porProduto.get(pid)!;
  };

  for (const ev of eventos) {
    usuariosMercado.add(ev.userId);
    const meta = ev.metadata as {
      produtoId?: string;
      substitutoId?: string;
    };

    if (ev.type === 'produto_adicionado_lista' && meta.produtoId) {
      row(meta.produtoId).listas.add(ev.userId);
    }
    if (['compra_confirmada', 'compra_realizada'].includes(ev.type) && meta.produtoId) {
      row(meta.produtoId).compras.add(ev.userId);
    }
    if (ev.type === 'produto_substituicao_aceita' && meta.substitutoId) {
      row(meta.substitutoId).trocas.add(ev.userId);
    }
  }

  return { porProduto, usuariosMercado };
}

function provaFromAgregado(
  produtoId: string,
  ag: AgregadoProduto,
  regiao: string,
  dias: number
): ProvaSocialProduto | null {
  const nListas = ag.listas.size;
  const nCompras = ag.compras.size;
  const nTrocas = ag.trocas.size;
  const total = new Set([...ag.listas, ...ag.compras, ...ag.trocas]).size;

  if (total < PROVA_SOCIAL_MIN_FAMILIAS) return null;

  let contexto: ProvaSocialContexto = 'popular';
  let n = total;

  if (nTrocas >= PROVA_SOCIAL_MIN_FAMILIAS && nTrocas >= nListas) {
    contexto = 'troca';
    n = nTrocas;
  } else if (nCompras >= PROVA_SOCIAL_MIN_FAMILIAS && nCompras >= nListas) {
    contexto = 'compra';
    n = nCompras;
  } else if (nListas >= PROVA_SOCIAL_MIN_FAMILIAS) {
    contexto = 'lista';
    n = nListas;
  }

  const mensagem = montarMensagem(n, regiao, contexto, dias);
  if (!mensagem) return null;

  return {
    produtoId,
    familiasUnicas: n,
    mensagem,
    contexto,
    periodoDias: dias,
  };
}

export async function getProvaSocialProduto(
  mercadoId: string,
  produtoId: string,
  dias = PROVA_SOCIAL_PERIODO_DIAS
): Promise<ProvaSocialProduto | null> {
  const [{ porProduto }, regiao] = await Promise.all([
    agregarPorProduto(mercadoId, dias),
    labelRegiaoMercado(mercadoId),
  ]);

  const ag = porProduto.get(produtoId);
  if (!ag) return null;
  return provaFromAgregado(produtoId, ag, regiao, dias);
}

export async function getProvaSocialBatch(
  mercadoId: string,
  produtoIds: string[],
  dias = PROVA_SOCIAL_PERIODO_DIAS
): Promise<Map<string, ProvaSocialProduto>> {
  const [{ porProduto }, regiao] = await Promise.all([
    agregarPorProduto(mercadoId, dias),
    labelRegiaoMercado(mercadoId),
  ]);

  const out = new Map<string, ProvaSocialProduto>();
  for (const pid of produtoIds) {
    const ag = porProduto.get(pid);
    if (!ag) continue;
    const p = provaFromAgregado(pid, ag, regiao, dias);
    if (p) out.set(pid, p);
  }
  return out;
}

export async function getProvaSocialMercadoResumo(
  mercadoId: string,
  dias = PROVA_SOCIAL_PERIODO_DIAS,
  limiteDestaques = 5
): Promise<ProvaSocialMercadoResumo> {
  const [{ porProduto, usuariosMercado }, regiao] = await Promise.all([
    agregarPorProduto(mercadoId, dias),
    labelRegiaoMercado(mercadoId),
  ]);

  const destaques: ProvaSocialProduto[] = [];
  for (const [pid, ag] of porProduto.entries()) {
    const p = provaFromAgregado(pid, ag, regiao, dias);
    if (p) destaques.push(p);
  }

  destaques.sort((a, b) => b.familiasUnicas - a.familiasUnicas);

  const topIds = destaques.slice(0, limiteDestaques).map((d) => d.produtoId);
  const nomes =
    topIds.length > 0
      ? await prisma.produtos.findMany({
          where: { id: { in: topIds } },
          select: { id: true, nome: true },
        })
      : [];
  const nomeMap = new Map(nomes.map((p) => [p.id, p.nome ?? 'Produto']));

  const destaquesComNome = destaques.slice(0, limiteDestaques).map((d) => ({
    ...d,
    mensagem: d.mensagem,
  }));

  const familiasAtivas = usuariosMercado.size;
  const contagemGeral = formatarContagemFamilias(familiasAtivas);
  let mensagemGeral = `Comunidade PRECIVOX ativa em ${regiao} — dados anônimos dos últimos ${dias} dias.`;
  if (contagemGeral) {
    mensagemGeral = `${contagemGeral} de ${regiao} usaram o PRECIVOX neste mercado nos últimos ${dias} dias.`;
  }

  return {
    mercadoId,
    regiaoLabel: regiao,
    familiasAtivasMercado: familiasAtivas,
    periodoDias: dias,
    destaques: destaquesComNome.map((d) => ({
      ...d,
      mensagem: `${nomeMap.get(d.produtoId) ?? 'Item'}: ${d.mensagem}`,
    })),
    mensagemGeral,
  };
}
