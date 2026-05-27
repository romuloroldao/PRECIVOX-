/**
 * Troca inteligente explicável — Épico 8.5
 */

import { prisma } from '@/lib/prisma';
import { EventCollector } from '@/lib/ai/event-collector';
import { jaccardTokensDeNomes } from '@/lib/produtos-nome-normalize';

export type SubstitutoBase = {
  produtoId: string;
  nome: string;
  preco: number;
  precoPromocional?: number | null;
  emPromocao: boolean;
  categoria?: string | null;
  marca?: string | null;
};

export type SubstitutoExplicavel = SubstitutoBase & {
  explicacao: string;
  motivos: string[];
  economiaVsOrigem: number | null;
  economiaPct: number | null;
  scorePessoal: number;
  aceitesUsuario: number;
  aceitesBairro: number;
  similaridadeNome: number | null;
};

export type HistoricoTroca = {
  produtoOrigemId: string;
  produtoOrigemNome: string;
  substitutoId: string;
  substitutoNome: string;
  modo: string;
  quando: string;
};

function precoEfetivo(p: SubstitutoBase): number {
  if (p.emPromocao && p.precoPromocional != null) return p.precoPromocional;
  return p.preco;
}

export async function contarAceitesSubstitutoMercado(
  mercadoId: string,
  substitutoId: string,
  dias = 30
): Promise<number> {
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const count = await prisma.userEvent.count({
    where: {
      mercadoId,
      type: 'produto_substituicao_aceita',
      timestamp: { gte: desde },
      metadata: {
        path: ['substitutoId'],
        equals: substitutoId,
      },
    },
  });

  return count;
}

function mapaAceitesUsuario(
  eventos: Awaited<ReturnType<typeof EventCollector.getUserEvents>>
): Map<string, number> {
  const m = new Map<string, number>();
  for (const ev of eventos) {
    if (ev.type !== 'produto_substituicao_aceita') continue;
    const sub = (ev.metadata as { substitutoId?: string }).substitutoId;
    if (sub) m.set(sub, (m.get(sub) ?? 0) + 1);
  }
  return m;
}

export function montarExplicacaoTroca(params: {
  origem: SubstitutoBase;
  candidato: SubstitutoBase;
  modo: 'categoria' | 'equivalente';
  similaridadeNome: number | null;
  aceitesUsuario: number;
  aceitesBairro: number;
}): { explicacao: string; motivos: string[]; economiaVsOrigem: number | null; economiaPct: number | null } {
  const { origem, candidato, modo, similaridadeNome, aceitesUsuario, aceitesBairro } = params;
  const motivos: string[] = [];
  const po = precoEfetivo(origem);
  const pc = precoEfetivo(candidato);
  let economiaVsOrigem: number | null = null;
  let economiaPct: number | null = null;

  if (pc < po) {
    economiaVsOrigem = Math.round((po - pc) * 100) / 100;
    economiaPct = po > 0 ? Math.round(((po - pc) / po) * 1000) / 10 : null;
    motivos.push(`Economiza R$ ${economiaVsOrigem.toFixed(2).replace('.', ',')} por unidade`);
  }

  if (modo === 'categoria' && origem.categoria && candidato.categoria === origem.categoria) {
    motivos.push(`Mesma categoria (${origem.categoria})`);
  }

  if (modo === 'equivalente' && similaridadeNome != null && similaridadeNome >= 0.2) {
    motivos.push(`Nome parecido (~${Math.round(similaridadeNome * 100)}% de similaridade)`);
  }

  if (candidato.emPromocao) {
    motivos.push('Substituto em promoção agora');
  }

  if (aceitesUsuario > 0) {
    motivos.push(
      aceitesUsuario === 1
        ? 'Você já aceitou esta troca antes'
        : `Você já aceitou esta troca ${aceitesUsuario} vezes`
    );
  }

  if (aceitesBairro >= 3) {
    motivos.push(`${aceitesBairro} trocas parecidas no mercado (últimos 30 dias)`);
  }

  if (motivos.length === 0) {
    motivos.push('Alternativa disponível no mesmo mercado');
  }

  const explicacao = motivos[0];
  return { explicacao, motivos, economiaVsOrigem, economiaPct };
}

export async function enriquecerSubstitutos(
  userId: string,
  mercadoId: string,
  origem: SubstitutoBase,
  candidatos: SubstitutoBase[],
  modo: 'categoria' | 'equivalente'
): Promise<SubstitutoExplicavel[]> {
  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 90);

  const eventos = await EventCollector.getUserEvents(userId, mercadoId, inicio, fim);
  const aceitesUser = mapaAceitesUsuario(eventos);

  const nomeOrig = origem.nome ?? '';
  const enriquecidos: SubstitutoExplicavel[] = [];

  for (const c of candidatos) {
    const similaridade =
      modo === 'equivalente' ? jaccardTokensDeNomes(nomeOrig, c.nome ?? '') : null;
    const aceitesUsuario = aceitesUser.get(c.produtoId) ?? 0;
    const aceitesBairro = await contarAceitesSubstitutoMercado(mercadoId, c.produtoId);

    const { explicacao, motivos, economiaVsOrigem, economiaPct } = montarExplicacaoTroca({
      origem,
      candidato: c,
      modo,
      similaridadeNome: similaridade,
      aceitesUsuario,
      aceitesBairro,
    });

    const scorePessoal =
      (economiaVsOrigem ?? 0) * 10 +
      aceitesUsuario * 25 +
      Math.min(aceitesBairro, 20) * 2 +
      (similaridade ?? 0) * 30 +
      (c.emPromocao ? 8 : 0);

    enriquecidos.push({
      ...c,
      explicacao,
      motivos,
      economiaVsOrigem,
      economiaPct,
      scorePessoal,
      aceitesUsuario,
      aceitesBairro,
      similaridadeNome: similaridade,
    });
  }

  enriquecidos.sort((a, b) => b.scorePessoal - a.scorePessoal);
  return enriquecidos;
}

export async function listarHistoricoTrocas(
  userId: string,
  mercadoId: string,
  limite = 8
): Promise<HistoricoTroca[]> {
  const desde = new Date();
  desde.setDate(desde.getDate() - 60);

  const eventos = await prisma.userEvent.findMany({
    where: {
      userId,
      mercadoId,
      type: 'produto_substituicao_aceita',
      timestamp: { gte: desde },
    },
    orderBy: { timestamp: 'desc' },
    take: limite,
  });

  const ids = new Set<string>();
  for (const ev of eventos) {
    const m = ev.metadata as { produtoId?: string; substitutoId?: string };
    if (m.produtoId) ids.add(m.produtoId);
    if (m.substitutoId) ids.add(m.substitutoId);
  }

  const produtos = await prisma.produtos.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, nome: true },
  });
  const nomes = new Map(produtos.map((p) => [p.id, p.nome ?? 'Produto']));

  return eventos.map((ev) => {
    const m = ev.metadata as {
      produtoId?: string;
      substitutoId?: string;
      modo?: string;
    };
    return {
      produtoOrigemId: m.produtoId ?? '',
      produtoOrigemNome: nomes.get(m.produtoId ?? '') ?? 'Produto original',
      substitutoId: m.substitutoId ?? '',
      substitutoNome: nomes.get(m.substitutoId ?? '') ?? 'Substituto',
      modo: m.modo ?? 'equivalente',
      quando: ev.timestamp.toISOString(),
    };
  });
}
