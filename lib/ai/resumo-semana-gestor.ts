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

export type AcaoSemanal = {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: 'alta' | 'media' | 'baixa';
  categoria: 'demanda' | 'lista' | 'nps' | 'estoque' | 'geral';
  linkHref?: string;
};

export type ResumoSemanalResult = {
  acoes: AcaoSemanal[];
  narrativa: string;
  periodoDias: number;
  geradoEm: string;
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
  periodoDias?: number
): ResumoSemanalResult {
  const acoes: AcaoSemanal[] = [];
  let idSeq = 0;
  const nextId = (prefix: string) => `${prefix}-${++idSeq}`;

  const topBusca = tendenciasBlock.tendencias[0];
  if (topBusca && topBusca.buscas >= 3) {
    acoes.push({
      id: nextId('demanda'),
      titulo: `Colocar "${topBusca.termo}" no radar`,
      descricao: `Demanda aparente na busca: termo buscado sem resultado no seu catálogo (~${topBusca.buscas} equiv./mês). Cadastre ou alinhe o nome ao que as pessoas digitam.`,
      prioridade: topBusca.demanda === 'ALTA' ? 'alta' : 'media',
      categoria: 'demanda',
      linkHref: `/gestor/produtos?sugestaoNome=${encodeURIComponent(topBusca.termo)}`,
    });
  }

  const topLista = abandonados[0];
  if (topLista && topLista.taxaDesistenciaLista >= 20) {
    acoes.push({
      id: nextId('lista'),
      titulo: `Rever "${topLista.nome}" na lista`,
      descricao: `Alta desistência na lista (${topLista.taxaDesistenciaLista}% remoções vs. adições). Compare o preço com a referência na sua região em Conversão (filtro de entorno) e a visibilidade na loja — o app não mede caixa.`,
      prioridade: topLista.taxaDesistenciaLista >= 40 ? 'alta' : 'media',
      categoria: 'lista',
      linkHref: `/gestor/produtos/${topLista.produtoId}`,
    });
  }

  const pctDet = nps.detratores;
  const topCritico = nps.temasCriticas[0];
  if (nps.total >= 3 && (pctDet >= 15 || topCritico)) {
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
    });
  }

  const firstRup = estoqueCritico[0];
  if (firstRup) {
    const nome = firstRup.produtos?.nome ?? 'Produto';
    acoes.push({
      id: nextId('estoque'),
      titulo: `Reposição urgente: ${nome}`,
      descricao: `Restam ${firstRup.quantidade} un. no sistema. Quem usa o app para montar lista pode desistir se vir ruptura.`,
      prioridade: firstRup.quantidade <= 3 ? 'alta' : 'media',
      categoria: 'estoque',
      linkHref: firstRup.produtos?.id ? `/gestor/produtos/${firstRup.produtos.id}` : undefined,
    });
  }

  const topElogio = nps.temasElogios[0];
  if (nps.total >= 5 && topElogio && topElogio.count >= 2) {
    acoes.push({
      id: nextId('reforco'),
      titulo: `Reforçar o que já elogiam: ${topElogio.label}`,
      descricao: `${topElogio.count} menções positivas neste tema. Mantenha visível (redes, cartaz na loja) — é seu diferencial percebido.`,
      prioridade: 'baixa',
      categoria: 'geral',
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

  const [tendenciasBlock, abandonados, nps, estoqueCritico] = await Promise.all([
    getTendenciasBuscaSemResultado(mercadoId, inicio, fim),
    getItensAbandonados(mercadoId, inicio, fim, 5, regiaoPreco, raioKm),
    getNpsAggregate(mercadoId, inicio, fim),
    getEstoqueCritico(mercadoId, 5),
  ]);

  return montarResumoSemanalFromDados(tendenciasBlock, abandonados, nps, estoqueCritico, mercadoNome, dias);
}

