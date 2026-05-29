/**
 * Alerta ruptura preditiva — busca alta + crowd sem confirmação (Épico 10.3)
 */

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export type RupturaPreditivaAlerta = {
  id: string;
  produtoId: string;
  produtoNome: string;
  estoqueId: string | null;
  unidadeId: string | null;
  unidadeNome: string | null;
  quantidadeAtual: number;
  buscasRecentes: number;
  listasAtivas: number;
  buscasSemResultado: number;
  confirmacoesCrowd: number;
  divergenciasCrowd: number;
  scoreRisco: number;
  prioridade: 'CRITICA' | 'ALTA' | 'MEDIA';
  motivo: string;
  acaoRecomendada: string;
};

export type RupturaPreditivaResumo = {
  mercadoId: string;
  periodoDias: number;
  alertas: RupturaPreditivaAlerta[];
  totalCriticos: number;
  explicacao: string;
};

const JANELA_CROWD_H = 48;

function scoreRisco(input: {
  quantidade: number;
  buscas: number;
  listas: number;
  semResultado: number;
  confirmacoes: number;
  divergencias: number;
}): number {
  let s = 0;
  if (input.quantidade === 0) s += 40;
  else if (input.quantidade <= 5) s += 30;
  else if (input.quantidade <= 15) s += 15;

  s += Math.min(25, input.buscas * 2);
  s += Math.min(20, input.listas * 4);
  s += Math.min(25, input.semResultado * 8);

  if (input.confirmacoes === 0) s += 15;
  if (input.divergencias > input.confirmacoes) s += 10;

  return Math.min(100, s);
}

function prioridadeDeScore(
  score: number,
  quantidade: number,
  semResultado: number,
  confirmacoes: number
): 'CRITICA' | 'ALTA' | 'MEDIA' {
  if (quantidade === 0 || (semResultado >= 2 && confirmacoes === 0)) return 'CRITICA';
  if (score >= 55 || (semResultado >= 1 && confirmacoes === 0)) return 'ALTA';
  return 'MEDIA';
}

export async function getAlertasRupturaPreditiva(
  mercadoId: string,
  dias = 7,
  limite = 12
): Promise<RupturaPreditivaResumo> {
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const desdeCrowd = new Date();
  desdeCrowd.setHours(desdeCrowd.getHours() - JANELA_CROWD_H);

  const [eventos, eventosCrowd, estoquesMercado] = await Promise.all([
    prisma.userEvent.findMany({
      where: {
        mercadoId,
        timestamp: { gte: desde },
        type: { in: ['produto_adicionado_lista', 'produto_buscado'] },
      },
      select: { type: true, metadata: true, userId: true },
    }),
    prisma.userEvent.findMany({
      where: {
        mercadoId,
        timestamp: { gte: desdeCrowd },
        type: { in: ['preco_confirmado', 'preco_reportado'] },
      },
      select: { type: true, metadata: true },
    }),
    prisma.estoques.findMany({
      where: { unidades: { mercadoId } },
      select: {
        id: true,
        quantidade: true,
        unidadeId: true,
        produtoId: true,
        unidades: { select: { nome: true } },
        produtos: { select: { id: true, nome: true, categoria: true } },
      },
    }),
  ]);

  const adds = new Map<string, Set<string>>();
  const buscasTermo = new Map<string, number>();
  const buscasSemResultadoTermo = new Map<string, number>();

  for (const ev of eventos) {
    const meta = ev.metadata as {
      produtoId?: string;
      searchQuery?: string;
      resultados?: number;
    };
    if (ev.type === 'produto_adicionado_lista' && meta.produtoId) {
      if (!adds.has(meta.produtoId)) adds.set(meta.produtoId, new Set());
      adds.get(meta.produtoId)!.add(ev.userId);
    }
    if (ev.type === 'produto_buscado' && meta.searchQuery) {
      const termo = meta.searchQuery.toLowerCase().slice(0, 80);
      buscasTermo.set(termo, (buscasTermo.get(termo) ?? 0) + 1);
      if (meta.resultados === 0) {
        buscasSemResultadoTermo.set(
          termo,
          (buscasSemResultadoTermo.get(termo) ?? 0) + 1
        );
      }
    }
  }

  const confirmacoesPorProduto = new Map<string, number>();
  const divergenciasPorProduto = new Map<string, number>();

  for (const ev of eventosCrowd) {
    const meta = ev.metadata as { produtoId?: string };
    if (!meta.produtoId) continue;
    if (ev.type === 'preco_confirmado') {
      confirmacoesPorProduto.set(
        meta.produtoId,
        (confirmacoesPorProduto.get(meta.produtoId) ?? 0) + 1
      );
    } else {
      divergenciasPorProduto.set(
        meta.produtoId,
        (divergenciasPorProduto.get(meta.produtoId) ?? 0) + 1
      );
    }
  }

  const produtoIds = new Set<string>();
  for (const e of estoquesMercado) produtoIds.add(e.produtoId);
  for (const id of adds.keys()) produtoIds.add(id);

  const candidatos: RupturaPreditivaAlerta[] = [];

  for (const produtoId of produtoIds) {
    const estoquesProd = estoquesMercado.filter((e) => e.produtoId === produtoId);
    const pior = estoquesProd.sort((a, b) => a.quantidade - b.quantidade)[0];
    const nome = pior?.produtos.nome ?? 'Produto';
    const nomeLower = nome.toLowerCase();

    let buscasRecentes = 0;
    let buscasSemResultado = 0;
    for (const [termo, count] of buscasTermo) {
      if (termo.length >= 3 && nomeLower.includes(termo)) {
        buscasRecentes += count;
        buscasSemResultado += buscasSemResultadoTermo.get(termo) ?? 0;
      }
    }

    const listasAtivas = adds.get(produtoId)?.size ?? 0;
    const confirmacoesCrowd = confirmacoesPorProduto.get(produtoId) ?? 0;
    const divergenciasCrowd = divergenciasPorProduto.get(produtoId) ?? 0;
    const quantidadeAtual = pior?.quantidade ?? 0;

    const demandaAlta =
      listasAtivas >= 3 ||
      buscasRecentes >= 5 ||
      buscasSemResultado >= 1 ||
      (listasAtivas >= 2 && buscasRecentes >= 2);

    const crowdAusente =
      confirmacoesCrowd === 0 ||
      divergenciasCrowd > confirmacoesCrowd;

    if (!demandaAlta || !crowdAusente) continue;

    const score = scoreRisco({
      quantidade: quantidadeAtual,
      buscas: buscasRecentes,
      listas: listasAtivas,
      semResultado: buscasSemResultado,
      confirmacoes: confirmacoesCrowd,
      divergencias: divergenciasCrowd,
    });

    const prioridade = prioridadeDeScore(
      score,
      quantidadeAtual,
      buscasSemResultado,
      confirmacoesCrowd
    );

    const motivos: string[] = [];
    if (buscasSemResultado > 0) {
      motivos.push(`${buscasSemResultado} busca(s) sem resultado no catálogo`);
    }
    if (buscasRecentes > 0) {
      motivos.push(`${buscasRecentes} buscas recentes no app`);
    }
    if (listasAtivas > 0) {
      motivos.push(`${listasAtivas} lista(s) ativa(s) com este item`);
    }
    if (confirmacoesCrowd === 0) {
      motivos.push('nenhuma confirmação crowd de preço nas últimas 48h');
    } else if (divergenciasCrowd > confirmacoesCrowd) {
      motivos.push('divergências crowd superam confirmações');
    }
    if (quantidadeAtual <= 15) {
      motivos.push(`estoque baixo (${quantidadeAtual} un.)`);
    }

    let acaoRecomendada =
      'Conferir gôndola e repor antes que a demanda vire abandono no app.';
    if (quantidadeAtual === 0) {
      acaoRecomendada =
        'Repor imediatamente — clientes buscam este item e não encontram no catálogo.';
    } else if (confirmacoesCrowd === 0) {
      acaoRecomendada =
        'Validar preço/etiqueta na loja e pedir confirmação crowd após reposição.';
    }

    candidatos.push({
      id: `ruptura-${produtoId}`,
      produtoId,
      produtoNome: nome,
      estoqueId: pior?.id ?? null,
      unidadeId: pior?.unidadeId ?? null,
      unidadeNome: pior?.unidades.nome ?? null,
      quantidadeAtual,
      buscasRecentes,
      listasAtivas,
      buscasSemResultado,
      confirmacoesCrowd,
      divergenciasCrowd,
      scoreRisco: score,
      prioridade,
      motivo: motivos.join(' · '),
      acaoRecomendada,
    });
  }

  candidatos.sort((a, b) => b.scoreRisco - a.scoreRisco);
  const alertas = candidatos.slice(0, limite);

  return {
    mercadoId,
    periodoDias: dias,
    alertas,
    totalCriticos: alertas.filter((a) => a.prioridade === 'CRITICA').length,
    explicacao:
      'Ruptura preditiva: alta intenção de compra (buscas/listas) sem confirmação crowd recente — sinal de item em falta ou preço desatualizado na gôndola.',
  };
}

/** Persiste alertas P1 no painel IA (best-effort, não bloqueia a API). */
export async function sincronizarAlertasRupturaPreditiva(
  mercadoId: string,
  alertas: RupturaPreditivaAlerta[]
): Promise<void> {
  if (alertas.length === 0) return;

  try {
    await prisma.alertas_ia.deleteMany({
      where: {
        mercadoId,
        tipo: 'RUPTURA_PREDITIVA',
        lido: false,
      },
    });

    const expira = new Date();
    expira.setDate(expira.getDate() + 3);

    await prisma.alertas_ia.createMany({
      data: alertas.slice(0, 8).map((a) => ({
        id: randomUUID(),
        mercadoId,
        unidadeId: a.unidadeId,
        produtoId: a.produtoId,
        tipo: 'RUPTURA_PREDITIVA',
        titulo: `Ruptura preditiva: ${a.produtoNome}`,
        descricao: a.motivo,
        prioridade: a.prioridade === 'CRITICA' ? 'ALTA' : a.prioridade,
        acaoRecomendada: a.acaoRecomendada,
        linkAcao: `/gestor/produtos?busca=${encodeURIComponent(a.produtoNome)}`,
        lido: false,
        metadata: {
          scoreRisco: a.scoreRisco,
          quantidadeAtual: a.quantidadeAtual,
          buscasRecentes: a.buscasRecentes,
          confirmacoesCrowd: a.confirmacoesCrowd,
        },
        expiradoEm: expira,
      })),
    });
  } catch (e) {
    console.error('[ruptura-preditiva] sync alertas_ia:', e);
  }
}
