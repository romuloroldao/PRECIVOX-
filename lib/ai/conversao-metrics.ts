import { prisma } from '@/lib/prisma';
import { agregarTemas, type ContagemTema } from '@/lib/ai/nps-themes';
import { buildChaveProdutoParaInsights, normalizeTermoBuscaChave } from '@/lib/produtos-nome-normalize';
import { resolverUnidadesReferenciaPreco } from '@/lib/regiao-preco-unidades';
import type { Prisma } from '@prisma/client';

export type TendenciaBuscaRow = {
  termo: string;
  buscas: number;
  demanda: 'ALTA' | 'MEDIA';
};

/** Sinais só do app (lista + eventos). Sem PDV / vendas no Precivox neste momento. */
export type ItemAbandonadoRow = {
  produtoId: string;
  nome: string;
  adicoes: number;
  remocoes: number;
  /** remoções ÷ adições no período (proxy de desistência na lista) */
  taxaDesistenciaLista: number;
  precoAtual?: number;
  precoMedioRegional?: number;
  diferencaPct?: number;
  recomendacao: string;
  /** Chave estável para cruzar o mesmo produto lógico entre cadastros (EAN ou nome+marca+cat normalizados). */
  chaveInsight?: string;
};

/** Referência de preço: entorno, UF ampliada ou raio em km (coordenadas da unidade). */
export type RegiaoPrecoRef = 'cidade' | 'ampla' | 'proximidade';

export type RegiaoPrecoResolvido = {
  pedido: RegiaoPrecoRef;
  efetivo: RegiaoPrecoRef;
  /** Pediu cidade mas faltou cidade no cadastro — caiu para ampliada. */
  fallbackDeCidadeParaAmpla: boolean;
  estado: string | null;
  cidade: string | null;
};

export function parseRegiaoPrecoParam(raw: string | null | undefined): RegiaoPrecoRef {
  if (raw === 'ampla') return 'ampla';
  if (raw === 'proximidade') return 'proximidade';
  return 'cidade';
}

export async function resolveRegiaoPrecoParaMercado(
  mercadoId: string,
  pedido: RegiaoPrecoRef
): Promise<RegiaoPrecoResolvido> {
  const u = await prisma.unidades.findFirst({
    where: { mercadoId },
    select: { estado: true, cidade: true },
  });
  const estado = u?.estado?.trim() || null;
  const cidade = u?.cidade?.trim() || null;

  if (pedido === 'proximidade') {
    return {
      pedido,
      efetivo: 'proximidade',
      fallbackDeCidadeParaAmpla: false,
      estado,
      cidade,
    };
  }

  let efetivo: RegiaoPrecoRef = 'ampla';
  let fallbackDeCidadeParaAmpla = false;

  if (pedido === 'cidade' && estado && cidade) {
    efetivo = 'cidade';
  } else {
    efetivo = 'ampla';
    if (pedido === 'cidade' && (!cidade || !estado)) {
      fallbackDeCidadeParaAmpla = true;
    }
  }

  return { pedido, efetivo, fallbackDeCidadeParaAmpla, estado, cidade };
}

function unidadesWherePrecoReferencia(ctx: RegiaoPrecoResolvido): { estado: string; cidade?: string } | null {
  if (!ctx.estado) return null;
  if (ctx.efetivo === 'cidade' && ctx.cidade) {
    return { estado: ctx.estado, cidade: ctx.cidade };
  }
  if (ctx.efetivo === 'ampla') {
    return { estado: ctx.estado };
  }
  return null;
}

async function resolverUnidadesParaPrecoMedio(
  mercadoId: string,
  ctx: RegiaoPrecoResolvido,
  raioKm: number
): Promise<Prisma.estoquesWhereInput['unidades'] | null> {
  const ctxGeo = { efetivo: ctx.efetivo, estado: ctx.estado, cidade: ctx.cidade };
  let ref = await resolverUnidadesReferenciaPreco(mercadoId, ctxGeo, raioKm);
  if (!ref && ctx.efetivo === 'proximidade') {
    const sub = ctx.estado && ctx.cidade ? 'cidade' : 'ampla';
    ref = await resolverUnidadesReferenciaPreco(
      mercadoId,
      { efetivo: sub, estado: ctx.estado, cidade: ctx.cidade },
      raioKm
    );
  }
  if (ref?.tipo === 'ids') {
    return { id: { in: ref.ids } };
  }
  if (ref?.tipo === 'prisma_unidades') {
    return ref.where;
  }
  return null;
}

/**
 * Preço médio na região de referência (mesma chave de insight ou categoria) para o card do cliente.
 */
export async function getPrecoReferenciaRegionalParaProduto(
  mercadoId: string,
  produtoId: string,
  precoAtual: number,
  regiaoPreco: RegiaoPrecoRef = 'ampla',
  raioKm = 25
): Promise<{ media: number | null; diferencaPct: number | null }> {
  const ctxRegiao = await resolveRegiaoPrecoParaMercado(mercadoId, regiaoPreco);
  const unidadesRef = await resolverUnidadesParaPrecoMedio(mercadoId, ctxRegiao, raioKm);
  const p = await prisma.produtos.findFirst({
    where: { id: produtoId },
    select: { chaveInsight: true, categoria: true },
  });
  if (!p || !unidadesRef) return { media: null, diferencaPct: null };
  const produtoWhere: Prisma.produtosWhereInput = p.chaveInsight
    ? { chaveInsight: p.chaveInsight }
    : p.categoria
      ? { categoria: p.categoria }
      : {};
  if (Object.keys(produtoWhere).length === 0) return { media: null, diferencaPct: null };
  const regional = await prisma.estoques.aggregate({
    where: {
      produtos: produtoWhere,
      unidades: unidadesRef,
    },
    _avg: { preco: true },
  });
  const avg = regional._avg.preco ? Number(regional._avg.preco) : null;
  if (!avg || avg <= 0) return { media: null, diferencaPct: null };
  const media = Math.round(avg * 100) / 100;
  const diferencaPct = Math.round(((precoAtual - avg) / avg) * 1000) / 10;
  return { media, diferencaPct };
}

export type NpsAggregate = {
  score: number | null;
  promotores: number;
  neutros: number;
  detratores: number;
  total: number;
  zonaLabel: string;
  comentariosRecentes: string[];
  /** Menções em comentários de notas 9–10 */
  temasElogios: ContagemTema[];
  /** Menções em comentários de notas 0–6 */
  temasCriticas: ContagemTema[];
};

function bucketDemanda(count: number, dias: number): 'ALTA' | 'MEDIA' {
  const porMes = (count / Math.max(dias, 1)) * 30;
  return porMes >= 40 ? 'ALTA' : 'MEDIA';
}

export async function getTendenciasBuscaSemResultado(
  mercadoId: string,
  inicio: Date,
  fim: Date
): Promise<{ tendencias: TendenciaBuscaRow[]; insight: string }> {
  const rows = await prisma.userEvent.findMany({
    where: {
      mercadoId,
      type: 'produto_buscado',
      timestamp: { gte: inicio, lte: fim },
    },
    select: { metadata: true },
  });

  const dias = Math.max(1, Math.ceil((fim.getTime() - inicio.getTime()) / 86400000));

  const map = new Map<string, { count: number; label: string }>();
  for (const r of rows) {
    const meta = r.metadata as Record<string, unknown> | null;
    if (!meta) continue;
    const res = meta.resultados;
    if (res !== 0 && res !== '0') continue;
    const q = meta.searchQuery;
    if (typeof q !== 'string' || !q.trim()) continue;
    const key = normalizeTermoBuscaChave(q);
    if (!key) continue;
    const trimmed = q.trim().slice(0, 120);
    const cur = map.get(key);
    if (!cur) {
      map.set(key, { count: 1, label: trimmed });
    } else {
      cur.count += 1;
    }
  }

  const tendencias: TendenciaBuscaRow[] = [...map.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([, { count, label }]) => ({
      termo: label,
      buscas: Math.round((count / dias) * 30),
      demanda: bucketDemanda(count, dias),
    }));

  const top = tendencias[0];
  const insight = top
    ? `Demanda aparente na busca: "${top.termo}" foi o termo mais buscado sem resultado no seu catálogo. Cadastrar ou alinhar o nome ao que as pessoas digitam reduz fricção.`
    : 'Ainda não há buscas sem resultado neste período. Os dados aparecem quando clientes buscam e o seu mercado não tem oferta correspondente.';

  return { tendencias, insight };
}

/** Resolve id de catálogo a partir de metadata de eventos (novos ou legados). */
export async function resolveProdutoCatalogoIdFromMeta(
  meta: Record<string, unknown>
): Promise<string | null> {
  const direct = meta.produtoCatalogoId;
  if (typeof direct === 'string' && direct.length > 0) return direct;

  const legacy = meta.produtoId;
  if (typeof legacy !== 'string' || !legacy) return null;

  if (legacy.length >= 73 && legacy[36] === '-') {
    const estoqueId = legacy.slice(0, 36);
    const row = await prisma.estoques.findUnique({
      where: { id: estoqueId },
      select: { produtoId: true },
    });
    return row?.produtoId ?? null;
  }

  return legacy;
}

export async function getItensAbandonados(
  mercadoId: string,
  inicio: Date,
  fim: Date,
  limite: number,
  regiaoPreco: RegiaoPrecoRef | RegiaoPrecoResolvido = 'cidade',
  raioKm = 25
): Promise<ItemAbandonadoRow[]> {
  const ctxRegiao: RegiaoPrecoResolvido =
    typeof regiaoPreco === 'object' && regiaoPreco !== null && 'efetivo' in regiaoPreco
      ? (regiaoPreco as RegiaoPrecoResolvido)
      : await resolveRegiaoPrecoParaMercado(mercadoId, regiaoPreco as RegiaoPrecoRef);
  const [adds, removes] = await Promise.all([
    prisma.userEvent.findMany({
      where: {
        mercadoId,
        type: 'produto_adicionado_lista',
        timestamp: { gte: inicio, lte: fim },
      },
      select: { metadata: true },
    }),
    prisma.userEvent.findMany({
      where: {
        mercadoId,
        type: 'produto_removido_lista',
        timestamp: { gte: inicio, lte: fim },
      },
      select: { metadata: true },
    }),
  ]);

  const addCounts = new Map<string, number>();
  for (const e of adds) {
    const meta = e.metadata as Record<string, unknown> | null;
    if (!meta) continue;
    const id = await resolveProdutoCatalogoIdFromMeta(meta);
    if (!id) continue;
    addCounts.set(id, (addCounts.get(id) || 0) + 1);
  }

  const removeCounts = new Map<string, number>();
  for (const e of removes) {
    const meta = e.metadata as Record<string, unknown> | null;
    if (!meta) continue;
    const id = await resolveProdutoCatalogoIdFromMeta(meta);
    if (!id) continue;
    removeCounts.set(id, (removeCounts.get(id) || 0) + 1);
  }

  const unidadeIds = await prisma.unidades.findMany({
    where: { mercadoId },
    select: { id: true },
  });
  if (unidadeIds.length === 0) return [];

  const candidatos = [...addCounts.entries()]
    .map(([produtoId, adicoes]) => {
      const remocoes = removeCounts.get(produtoId) || 0;
      const taxaDesistenciaLista =
        adicoes > 0 ? Math.min(100, Math.round((remocoes / adicoes) * 1000) / 10) : 0;
      return { produtoId, adicoes, remocoes, taxaDesistenciaLista };
    })
    .filter((x) => x.adicoes >= 3)
    .sort((a, b) => b.taxaDesistenciaLista - a.taxaDesistenciaLista || b.adicoes - a.adicoes)
    .slice(0, limite);

  if (candidatos.length === 0) return [];

  const produtoIds = candidatos.map((c) => c.produtoId);
  const produtos = await prisma.produtos.findMany({
    where: { id: { in: produtoIds } },
    select: {
      id: true,
      nome: true,
      categoria: true,
      marca: true,
      codigoBarras: true,
      chaveInsight: true,
      estoques: {
        where: { unidades: { mercadoId } },
        take: 1,
        orderBy: { preco: 'asc' },
        select: { preco: true },
      },
    },
  });

  const nomePorId = new Map(produtos.map((p) => [p.id, p]));

  const unidadesRef = await resolverUnidadesParaPrecoMedio(mercadoId, ctxRegiao, raioKm);

  const out: ItemAbandonadoRow[] = [];

  for (const c of candidatos) {
    const p = nomePorId.get(c.produtoId);
    const nome = p?.nome || `Produto ${c.produtoId.slice(0, 8)}`;
    const precoRow = p?.estoques[0]?.preco;
    const precoAtual = precoRow ? Number(precoRow) : undefined;

    let precoMedioRegional: number | undefined;
    let diferencaPct: number | undefined;

    const produtoWhere: Prisma.produtosWhereInput = p?.chaveInsight
      ? { chaveInsight: p.chaveInsight }
      : p?.categoria
        ? { categoria: p.categoria }
        : {};

    if (precoAtual != null && unidadesRef && Object.keys(produtoWhere).length > 0) {
      const regional = await prisma.estoques.aggregate({
        where: {
          produtos: produtoWhere,
          unidades: unidadesRef,
        },
        _avg: { preco: true },
      });
      const avg = regional._avg.preco ? Number(regional._avg.preco) : null;
      if (avg && avg > 0) {
        precoMedioRegional = Math.round(avg * 100) / 100;
        diferencaPct = Math.round(((precoAtual - avg) / avg) * 1000) / 10;
      }
    }

    let recomendacao = '';
    if (c.taxaDesistenciaLista >= 35) {
      recomendacao =
        'Alta taxa de remoção na lista em relação às adições. Revise preço percebido, disponibilidade e destaque na loja física.';
    } else if (diferencaPct != null && diferencaPct > 5 && precoMedioRegional != null) {
      const refTipo = p?.chaveInsight ? 'este produto (referência agregada)' : 'esta categoria';
      recomendacao = `O preço no catálogo está ~${diferencaPct}% acima da referência média na sua região para ${refTipo} (R$ ${precoMedioRegional.toFixed(2)}). Ajustar pode ajudar a manter o item na lista.`;
    } else {
      recomendacao =
        'Acompanhe intenção na lista versus retenção. O app não registra compra no caixa — preço e estoque seguem como alavancas.';
    }

    const chaveInsight = p
      ? p.chaveInsight ||
        buildChaveProdutoParaInsights({
          nome: p.nome,
          codigoBarras: p.codigoBarras,
          marca: p.marca,
          categoria: p.categoria,
        })
      : undefined;

    out.push({
      produtoId: c.produtoId,
      nome,
      adicoes: c.adicoes,
      remocoes: c.remocoes,
      taxaDesistenciaLista: c.taxaDesistenciaLista,
      ...(precoAtual != null ? { precoAtual } : {}),
      ...(precoMedioRegional != null ? { precoMedioRegional } : {}),
      ...(diferencaPct != null ? { diferencaPct } : {}),
      recomendacao,
      ...(chaveInsight ? { chaveInsight } : {}),
    });
  }

  return out;
}

export async function getNpsAggregate(mercadoId: string, inicio: Date, fim: Date): Promise<NpsAggregate> {
  const rows = await prisma.npsResponse.findMany({
    where: {
      mercadoId,
      createdAt: { gte: inicio, lte: fim },
    },
    select: { score: true, comment: true },
  });

  if (rows.length === 0) {
    return {
      score: null,
      promotores: 0,
      neutros: 0,
      detratores: 0,
      total: 0,
      zonaLabel: 'Sem respostas no período',
      comentariosRecentes: [],
      temasElogios: [],
      temasCriticas: [],
    };
  }

  let p = 0,
    n = 0,
    d = 0;
  for (const r of rows) {
    if (r.score >= 9) p++;
    else if (r.score >= 7) n++;
    else d++;
  }

  const total = rows.length;
  const nps = Math.round(((p - d) / total) * 100);
  const comentariosRecentes = rows
    .map((r) => r.comment)
    .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
    .slice(-5);

  const comComentario = rows.map((r) => ({
    texto: r.comment,
    score: r.score,
  }));
  const temasElogios = agregarTemas(comComentario, 'elogio');
  const temasCriticas = agregarTemas(comComentario, 'critica');

  let zonaLabel = 'NPS';
  if (nps >= 50) zonaLabel = 'Zona de Excelência (50+)';
  else if (nps >= 0) zonaLabel = 'Zona de qualidade (0–49)';
  else zonaLabel = 'Zona de melhoria (negativo)';

  return {
    score: nps,
    promotores: Math.round((p / total) * 1000) / 10,
    neutros: Math.round((n / total) * 1000) / 10,
    detratores: Math.round((d / total) * 1000) / 10,
    total,
    zonaLabel,
    comentariosRecentes,
    temasElogios,
    temasCriticas,
  };
}

export async function getMetricasConversaoResumo(
  mercadoId: string,
  inicio: Date,
  fim: Date
): Promise<{
  adicoesLista: number;
  remocoesLista: number;
  buscasLista: number;
  /** Opcional: só preenchido se existir tabela de vendas alimentada (ex.: futuro import) */
  linhasVendaImportadas: number;
  ticketMedioImportado: number | null;
}> {
  const baseEvent = { mercadoId, timestamp: { gte: inicio, lte: fim } as const };

  const [adicoesLista, remocoesLista, buscasLista] = await Promise.all([
    prisma.userEvent.count({
      where: { ...baseEvent, type: 'produto_adicionado_lista' },
    }),
    prisma.userEvent.count({
      where: { ...baseEvent, type: 'produto_removido_lista' },
    }),
    prisma.userEvent.count({
      where: { ...baseEvent, type: 'produto_buscado' },
    }),
  ]);

  const unidadeIds = await prisma.unidades.findMany({
    where: { mercadoId },
    select: { id: true },
  });
  const uids = unidadeIds.map((u) => u.id);

  let linhasVendaImportadas = 0;
  let ticketMedioImportado: number | null = null;

  if (uids.length > 0) {
    const vendas = await prisma.vendas.findMany({
      where: {
        dataVenda: { gte: inicio, lte: fim },
        unidadeId: { in: uids },
      },
      select: { precoTotal: true },
    });
    linhasVendaImportadas = vendas.length;
    ticketMedioImportado =
      linhasVendaImportadas > 0
        ? Math.round(
            (vendas.reduce((s, v) => s + Number(v.precoTotal), 0) / linhasVendaImportadas) * 100
          ) / 100
        : null;
  }

  return {
    adicoesLista,
    remocoesLista,
    buscasLista,
    linhasVendaImportadas,
    ticketMedioImportado,
  };
}
