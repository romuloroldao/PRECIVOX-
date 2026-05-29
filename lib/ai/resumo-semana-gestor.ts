import { prisma } from '@/lib/prisma';
import {
  getItensAbandonados,
  getNpsAggregate,
  getTendenciasBuscaSemResultado,
  type ItemAbandonadoRow,
  type NpsAggregate,
  type RegiaoPrecoRef,
  type RegiaoPrecoResolvido,
} from '@/lib/ai/conversao-metrics';
import { getAlertasRupturaPreditiva, type RupturaPreditivaAlerta } from '@/lib/ruptura-preditiva';
import { getBenchmarkPrecoRegional, type BenchmarkPrecoItem } from '@/lib/benchmark-preco-regional';
import { getSugestoesPricingAssistido } from '@/lib/pricing-assistido';
import { getRadarDemandaMercado, type RadarDemandaItem } from '@/lib/radar-demanda';
import { getCatalogoSaude } from '@/lib/catalogo-saude';

export type AcaoSemanal = {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: 'alta' | 'media' | 'baixa';
  categoria:
    | 'demanda'
    | 'lista'
    | 'nps'
    | 'estoque'
    | 'geral'
    | 'preco'
    | 'promocao'
    | 'ruptura'
    | 'catalogo';
  linkHref?: string;
  /** Fontes GROOC — transparência sobre de onde veio a recomendação */
  fontes?: string[];
};

export type ResumoSemanalResult = {
  acoes: AcaoSemanal[];
  narrativa: string;
  periodoDias: number;
  geradoEm: string;
  fontesResumo: string[];
};

export type ResumoSemanalContextoExtra = {
  ruptura?: RupturaPreditivaAlerta[];
  benchmarkAcima?: BenchmarkPrecoItem[];
  pricingSugestoes?: number;
  pricingTopNome?: string;
  radarTop?: RadarDemandaItem[];
  catalogoPctStale?: number;
};

export async function getEstoqueCritico(mercadoId: string, limite: number) {
  return prisma.estoques.findMany({
    where: {
      disponivel: true,
      quantidade: { lte: 8, gt: 0 },
      unidades: { mercadoId },
    },
    orderBy: [{ quantidade: 'asc' }],
    take: limite,
    include: {
      produtos: { select: { id: true, nome: true } },
    },
  });
}

function buildNarrativa(acoes: AcaoSemanal[], mercadoNome: string | null): string {
  if (acoes.length === 0) {
    return `Ainda há poucos sinais de uso no app para um resumo completo${
      mercadoNome ? ` (${mercadoNome})` : ''
    }. Com buscas, lista, NPS e estoque preenchidos, as prioridades aparecem aqui.`;
  }

  const top = acoes.slice(0, 3);
  const frases = top.map((a, i) => `${i + 1}) ${a.titulo}: ${a.descricao.split('.')[0]}.`);
  return `Resumo de comportamento e operação${mercadoNome ? ` — ${mercadoNome}` : ''}: ${frases.join(' ')}`;
}

type TendenciasBlock = Awaited<ReturnType<typeof getTendenciasBuscaSemResultado>>;

/**
 * Monta o resumo a partir de dados já calculados (evita queries duplicadas na API de conversão).
 */
export function montarResumoSemanalFromDados(
  tendenciasBlock: TendenciasBlock,
  abandonados: ItemAbandonadoRow[],
  nps: NpsAggregate,
  estoqueCritico: Awaited<ReturnType<typeof getEstoqueCritico>>,
  mercadoNome?: string | null,
  periodoDias?: number,
  extra?: ResumoSemanalContextoExtra
): ResumoSemanalResult {
  const acoes: AcaoSemanal[] = [];
  const fontesSet = new Set<string>();
  let idSeq = 0;
  const nextId = (prefix: string) => `${prefix}-${++idSeq}`;

  const topRuptura = extra?.ruptura?.[0];
  if (topRuptura) {
    fontesSet.add('Ruptura preditiva (buscas + crowd, 7d)');
    acoes.push({
      id: nextId('ruptura'),
      titulo: `Ruptura preditiva: ${topRuptura.produtoNome}`,
      descricao: `${topRuptura.motivo}. ${topRuptura.acaoRecomendada}`,
      prioridade: topRuptura.prioridade === 'CRITICA' ? 'alta' : 'media',
      categoria: 'ruptura',
      linkHref: `/gestor/produtos/${topRuptura.produtoId}`,
      fontes: ['Eventos produto_buscado', 'Confirmações crowd 48h', 'Estoque catálogo'],
    });
  }

  const topBench = extra?.benchmarkAcima?.[0];
  if (topBench && topBench.diferencaPct > 5) {
    fontesSet.add('Benchmark preço regional agregado');
    acoes.push({
      id: nextId('preco'),
      titulo: `Preço acima do bairro: ${topBench.produtoNome}`,
      descricao: `Seu R$ ${topBench.precoAtual.toFixed(2)} está ~${topBench.diferencaPct}% acima da referência (R$ ${topBench.precoMedioRegional.toFixed(2)}). ${topBench.recomendacao}`,
      prioridade: topBench.diferencaPct > 12 ? 'alta' : 'media',
      categoria: 'preco',
      linkHref: `/gestor/produtos/${topBench.produtoId}`,
      fontes: ['Benchmark regional (exclui seu catálogo)', 'chaveInsight ou categoria'],
    });
  }

  if (extra?.pricingSugestoes && extra.pricingSugestoes > 0) {
    fontesSet.add('Motor de promoção + radar demanda');
    acoes.push({
      id: nextId('promo'),
      titulo: `${extra.pricingSugestoes} promoção(ões) pronta(s) para aprovar`,
      descricao: extra.pricingTopNome
        ? `Destaque: "${extra.pricingTopNome}". Aprovação em 1 toque atualiza o catálogo com truth layer do gestor.`
        : 'Sugestões explicáveis com impacto estimado — revise e aprove em Promoções.',
      prioridade: 'media',
      categoria: 'promocao',
      linkHref: '/gestor/ia/promocoes',
      fontes: ['PromotionEngine', 'Radar demanda bairro', 'Giro de estoque'],
    });
  }

  const topRadar = extra?.radarTop?.find((r) => r.pressao === 'ALTA') ?? extra?.radarTop?.[0];
  if (topRadar && (topRadar.listasAtivas >= 3 || topRadar.buscasRecentes >= 5)) {
    fontesSet.add('Radar demanda do bairro (7d)');
    acoes.push({
      id: nextId('radar'),
      titulo: `Demanda latente: ${topRadar.nome}`,
      descricao: `${topRadar.listasAtivas} lista(s) ativa(s) e ${topRadar.buscasRecentes} buscas recentes no bairro. Garanta estoque e destaque na gôndola.`,
      prioridade: topRadar.pressao === 'ALTA' ? 'alta' : 'media',
      categoria: 'demanda',
      linkHref: `/gestor/produtos?busca=${encodeURIComponent(topRadar.nome)}`,
      fontes: ['produto_adicionado_lista', 'produto_buscado (agregado)'],
    });
  }

  if (extra?.catalogoPctStale != null && extra.catalogoPctStale >= 15) {
    fontesSet.add('Saúde do catálogo (SLA tier)');
    acoes.push({
      id: nextId('catalogo'),
      titulo: 'Atualizar catálogo desatualizado',
      descricao: `${extra.catalogoPctStale.toFixed(0)}% dos SKUs estão stale versus o SLA do seu tier. Sync ou upload evita preços errados no app.`,
      prioridade: extra.catalogoPctStale >= 30 ? 'alta' : 'media',
      categoria: 'catalogo',
      linkHref: '/gestor/produtos',
      fontes: ['estoques.atualizadoEm', 'Parceiro tier SLA'],
    });
  }

  const topBusca = tendenciasBlock.tendencias[0];
  if (topBusca && topBusca.buscas >= 3) {
    fontesSet.add('Buscas sem resultado no catálogo');
    acoes.push({
      id: nextId('demanda'),
      titulo: `Colocar "${topBusca.termo}" no radar`,
      descricao: `Demanda aparente na busca: termo buscado sem resultado no seu catálogo (~${topBusca.buscas} equiv./mês). Cadastre ou alinhe o nome ao que as pessoas digitam.`,
      prioridade: topBusca.demanda === 'ALTA' ? 'alta' : 'media',
      categoria: 'demanda',
      linkHref: `/gestor/produtos?sugestaoNome=${encodeURIComponent(topBusca.termo)}`,
      fontes: ['produto_buscado (resultados=0)'],
    });
  }

  const topLista = abandonados[0];
  if (topLista && topLista.taxaDesistenciaLista >= 20) {
    fontesSet.add('Comportamento na lista (adições/remoções)');
    acoes.push({
      id: nextId('lista'),
      titulo: `Rever "${topLista.nome}" na lista`,
      descricao: `Alta desistência na lista (${topLista.taxaDesistenciaLista}% remoções vs. adições). Compare o preço com a referência na sua região em Conversão (filtro de entorno) e a visibilidade na loja — o app não mede caixa.`,
      prioridade: topLista.taxaDesistenciaLista >= 40 ? 'alta' : 'media',
      categoria: 'lista',
      linkHref: `/gestor/produtos/${topLista.produtoId}`,
      fontes: ['produto_adicionado_lista', 'produto_removido_lista'],
    });
  }

  const pctDet = nps.detratores;
  const topCritico = nps.temasCriticas[0];
  if (nps.total >= 3 && (pctDet >= 15 || topCritico)) {
    fontesSet.add('NPS e temas em comentários');
    const tema = topCritico?.label ?? 'satisfação geral';
    acoes.push({
      id: nextId('nps'),
      titulo: `Ouvir críticas: ${tema}`,
      descricao:
        pctDet >= 15
          ? `${pctDet.toFixed(0)}% de detratores no período. Leia os comentários recentes e uma ação simples (ex.: fila no horário de pico) já ajuda.`
          : `Comentários citam bastante “${tema}”. Antecipe antes que o NPS piore.`,
      prioridade: pctDet >= 25 ? 'alta' : 'media',
      categoria: 'nps',
      fontes: ['nps_responses', 'Temas NLP (nps-themes)'],
    });
  }

  const firstRup = estoqueCritico[0];
  if (firstRup) {
    fontesSet.add('Estoque crítico no catálogo');
    const nome = firstRup.produtos?.nome ?? 'Produto';
    acoes.push({
      id: nextId('estoque'),
      titulo: `Reposição urgente: ${nome}`,
      descricao: `Restam ${firstRup.quantidade} un. no sistema. Quem usa o app para montar lista pode desistir se vir ruptura.`,
      prioridade: firstRup.quantidade <= 3 ? 'alta' : 'media',
      categoria: 'estoque',
      linkHref: firstRup.produtos?.id ? `/gestor/produtos/${firstRup.produtos.id}` : undefined,
      fontes: ['estoques.quantidade'],
    });
  }

  const topElogio = nps.temasElogios[0];
  if (nps.total >= 5 && topElogio && topElogio.count >= 2) {
    fontesSet.add('NPS — elogios');
    acoes.push({
      id: nextId('reforco'),
      titulo: `Reforçar o que já elogiam: ${topElogio.label}`,
      descricao: `${topElogio.count} menções positivas neste tema. Mantenha visível (redes, cartaz na loja) — é seu diferencial percebido.`,
      prioridade: 'baixa',
      categoria: 'geral',
      fontes: ['nps_responses (promotores)'],
    });
  }

  const ordem: Record<'alta' | 'media' | 'baixa', number> = { alta: 0, media: 1, baixa: 2 };
  acoes.sort((a, b) => ordem[a.prioridade] - ordem[b.prioridade]);

  const narrativa = buildNarrativa(acoes, mercadoNome ?? null);

  return {
    acoes: acoes.slice(0, 8),
    narrativa,
    periodoDias: periodoDias ?? 30,
    geradoEm: new Date().toISOString(),
    fontesResumo: [...fontesSet],
  };
}

/**
 * Carrega tudo do banco (uso isolado: página /api só resumo-semana).
 */
export async function buildResumoSemanalGestor(
  mercadoId: string,
  dias: number,
  mercadoNome?: string | null,
  regiaoPreco: RegiaoPrecoRef | RegiaoPrecoResolvido = 'cidade',
  raioKm = 25
): Promise<ResumoSemanalResult> {
  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - dias);

  const [tendenciasBlock, abandonados, nps, estoqueCritico, ruptura, benchmark, pricing, radar, catalogo] =
    await Promise.all([
      getTendenciasBuscaSemResultado(mercadoId, inicio, fim),
      getItensAbandonados(mercadoId, inicio, fim, 5, regiaoPreco, raioKm),
      getNpsAggregate(mercadoId, inicio, fim),
      getEstoqueCritico(mercadoId, 5),
      getAlertasRupturaPreditiva(mercadoId, Math.min(dias, 7), 3),
      getBenchmarkPrecoRegional(mercadoId, typeof regiaoPreco === 'object' ? regiaoPreco.pedido : regiaoPreco, raioKm, 5),
      getSugestoesPricingAssistido(mercadoId, 5),
      getRadarDemandaMercado(mercadoId, 7),
      getCatalogoSaude(mercadoId),
    ]);

  const benchmarkAcima = benchmark.itens.filter((i) => i.posicao === 'ACIMA');

  return montarResumoSemanalFromDados(
    tendenciasBlock,
    abandonados,
    nps,
    estoqueCritico,
    mercadoNome,
    dias,
    {
      ruptura: ruptura.alertas,
      benchmarkAcima,
      pricingSugestoes: pricing.sugestoes.length,
      pricingTopNome: pricing.sugestoes[0]?.produtoNome,
      radarTop: radar.itens.slice(0, 3),
      catalogoPctStale: catalogo.pctStale,
    }
  );
}

