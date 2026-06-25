/**
 * Atacado vs varejo — volume familiar + economia líquida (Épico 7.5)
 */

import { prisma } from '@/lib/prisma';
import { EventCollector } from '@/lib/ai/event-collector';
import {
  calcularEconomiaLiquida,
  distanciaKmEntreCoords,
  type ResultadoEconomiaLiquida,
} from '@/lib/economia-liquida';
import { getElCalcularOpts } from '@/lib/el-config-usuario-server';

export type RecomendacaoFormato = 'atacado' | 'varejo' | 'indiferente';

export type ComparativoAtacadoVarejo = {
  produtoVarejoId: string;
  produtoAtacadoId: string;
  nomeVarejo: string;
  nomeAtacado: string;
  precoVarejo: number;
  precoAtacado: number;
  volumeVarejo: number;
  volumeAtacado: number;
  unidadeBase: string;
  precoPorUnidadeVarejo: number;
  precoPorUnidadeAtacado: number;
  economiaPct: number;
  recomendacao: RecomendacaoFormato;
  mensagem: string;
  volumeFamiliarPessoas: number;
  economiaLiquida: ResultadoEconomiaLiquida | null;
  unidadeAtacadoNome: string;
};

type VolumeInfo = { valor: number; base: string };

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function extrairVolume(nome: string, unidadeMedida?: string | null): VolumeInfo {
  const n = nome.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

  const kg = n.match(/(\d+[,.]?\d*)\s*kg/);
  if (kg) return { valor: parseFloat(kg[1].replace(',', '.')), base: 'kg' };

  const g = n.match(/(\d+[,.]?\d*)\s*g\b/);
  if (g) return { valor: parseFloat(g[1].replace(',', '.')) / 1000, base: 'kg' };

  const l = n.match(/(\d+[,.]?\d*)\s*l\b/);
  if (l) return { valor: parseFloat(l[1].replace(',', '.')), base: 'l' };

  const ml = n.match(/(\d+[,.]?\d*)\s*ml/);
  if (ml) return { valor: parseFloat(ml[1].replace(',', '.')) / 1000, base: 'l' };

  const un = n.match(/(\d+)\s*(un|und|pct|pacote|fardo|cx|c\/)/);
  if (un) return { valor: parseInt(un[1], 10), base: 'un' };

  const um = (unidadeMedida ?? 'UN').toUpperCase();
  if (um === 'KG') return { valor: 1, base: 'kg' };
  if (um === 'L' || um === 'LT') return { valor: 1, base: 'l' };
  return { valor: 1, base: 'un' };
}

export function chaveFamilia(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\d+[,.]?\d*\s*(kg|g|ml|l|un|und|pct|cx|fardo)\b/gi, '')
    .replace(/\b(pack|pacote|fardo|atacado|promo)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 4)
    .join(' ');
}

export function parseVolumeFamiliar(perfilPreci: unknown): number {
  if (!perfilPreci || typeof perfilPreci !== 'object') return 3;
  const v = (perfilPreci as { volumeFamiliar?: number }).volumeFamiliar;
  if (typeof v === 'number' && v >= 1 && v <= 12) return Math.round(v);
  return 3;
}

function inferirPessoasDeEventos(
  eventos: Awaited<ReturnType<typeof EventCollector.getUserEvents>>
): number {
  const qtds: number[] = [];
  for (const ev of eventos) {
    if (ev.type !== 'produto_adicionado_lista') continue;
    const q = (ev.metadata as { quantidade?: number }).quantidade;
    if (typeof q === 'number' && q > 0) qtds.push(q);
  }
  if (qtds.length === 0) return 3;
  const media = qtds.reduce((a, b) => a + b, 0) / qtds.length;
  if (media >= 3) return 5;
  if (media >= 2) return 4;
  return 2;
}

function precoEfetivo(preco: number, promo: number | null, emPromo: boolean): number {
  if (emPromo && promo != null) return promo;
  return preco;
}

async function melhorEstoque(produtoId: string, mercadoId: string) {
  return prisma.estoques.findFirst({
    where: {
      produtoId,
      disponivel: true,
      quantidade: { gt: 0 },
      unidades: { mercadoId, ativa: true },
    },
    orderBy: [{ emPromocao: 'desc' }, { preco: 'asc' }],
    include: {
      unidades: {
        select: {
          id: true,
          nome: true,
          latitude: true,
          longitude: true,
          mercados: { select: { id: true, nome: true } },
        },
      },
    },
  });
}

function decidirRecomendacao(params: {
  economiaPct: number;
  volumeVarejo: number;
  volumeAtacado: number;
  base: string;
  pessoas: number;
  consumoSemanalUnidades: number | null;
}): { recomendacao: RecomendacaoFormato; mensagem: string } {
  const { economiaPct, volumeVarejo, volumeAtacado, base, pessoas, consumoSemanalUnidades } =
    params;

  if (economiaPct < 5) {
    return {
      recomendacao: 'indiferente',
      mensagem: 'Diferença pequena entre formatos — escolha pelo hábito da casa.',
    };
  }

  const ratio = volumeAtacado / Math.max(volumeVarejo, 0.001);
  const consumo = consumoSemanalUnidades ?? pessoas * 0.5;
  const semanasParaConsumirAtacado = volumeAtacado / Math.max(consumo, 0.1);

  if (economiaPct >= 8 && (pessoas >= 4 || semanasParaConsumirAtacado <= 4)) {
    return {
      recomendacao: 'atacado',
      mensagem: `Atacado ~${economiaPct.toFixed(0)}% mais barato por ${base} — volume da família (~${pessoas} pessoas) compensa o pacote maior.`,
    };
  }

  if (pessoas <= 2 && ratio >= 3) {
    return {
      recomendacao: 'varejo',
      mensagem: `Varejo faz mais sentido para casa pequena — pacote grande demora ~${Math.ceil(semanasParaConsumirAtacado)} semanas para acabar.`,
    };
  }

  if (economiaPct >= 12) {
    return {
      recomendacao: 'atacado',
      mensagem: `Economia de ~${economiaPct.toFixed(0)}% por ${base} no formato maior — vale comparar validade e espaço.`,
    };
  }

  return {
    recomendacao: 'varejo',
    mensagem: 'Formato menor reduz desperdício; economia do atacado não compensa para seu padrão.',
  };
}

export async function compararParAtacadoVarejo(
  produtoVarejoId: string,
  produtoAtacadoId: string,
  mercadoId: string,
  pessoas: number,
  consumoSemanal: number | null,
  userId?: string
): Promise<ComparativoAtacadoVarejo | null> {
  const [estV, estA, prodV, prodA] = await Promise.all([
    melhorEstoque(produtoVarejoId, mercadoId),
    melhorEstoque(produtoAtacadoId, mercadoId),
    prisma.produtos.findUnique({
      where: { id: produtoVarejoId },
      select: { nome: true, unidadeMedida: true },
    }),
    prisma.produtos.findUnique({
      where: { id: produtoAtacadoId },
      select: { nome: true, unidadeMedida: true },
    }),
  ]);

  if (!estV || !estA || !prodV || !prodA) return null;

  const volV = extrairVolume(prodV.nome ?? '', prodV.unidadeMedida);
  const volA = extrairVolume(prodA.nome ?? '', prodA.unidadeMedida);
  if (volV.base !== volA.base || volA.valor <= volV.valor * 1.2) return null;

  const precoV = precoEfetivo(
    estV.preco.toNumber(),
    estV.precoPromocional?.toNumber() ?? null,
    estV.emPromocao
  );
  const precoA = precoEfetivo(
    estA.preco.toNumber(),
    estA.precoPromocional?.toNumber() ?? null,
    estA.emPromocao
  );

  const puV = precoV / volV.valor;
  const puA = precoA / volA.valor;
  const economiaPct = puV > 0 ? round2(((puV - puA) / puV) * 100) : 0;

  let economiaLiquida: ResultadoEconomiaLiquida | null = null;
  const elOpts = await getElCalcularOpts(userId);
  const uV = estV.unidades;
  const uA = estA.unidades;
  if (uV && uA && estV.unidadeId !== estA.unidadeId) {
    let distanciaKm: number | null = null;
    if (
      uV.latitude != null &&
      uV.longitude != null &&
      uA.latitude != null &&
      uA.longitude != null
    ) {
      distanciaKm = distanciaKmEntreCoords(
        uV.latitude,
        uV.longitude,
        uA.latitude,
        uA.longitude
      );
    }
    economiaLiquida = calcularEconomiaLiquida({
      precoOrigem: precoV,
      precoDestino: precoA,
      distanciaKm,
      ...elOpts,
    });
  }

  const { recomendacao, mensagem } = decidirRecomendacao({
    economiaPct,
    volumeVarejo: volV.valor,
    volumeAtacado: volA.valor,
    base: volV.base,
    pessoas,
    consumoSemanalUnidades: consumoSemanal,
  });

  let msgFinal = mensagem;
  if (
    recomendacao === 'atacado' &&
    economiaLiquida &&
    economiaLiquida.recomendacao === 'ficar' &&
    economiaLiquida.economiaLiquida < 0
  ) {
    msgFinal += ' Outra unidade: viagem pode comer a economia (EL negativa).';
  } else if (recomendacao === 'atacado' && economiaLiquida?.recomendacao === 'ir') {
    msgFinal += ` EL: +R$ ${economiaLiquida.economiaLiquida.toFixed(2)} na unidade atacado.`;
  }

  return {
    produtoVarejoId,
    produtoAtacadoId,
    nomeVarejo: prodV.nome ?? 'Varejo',
    nomeAtacado: prodA.nome ?? 'Atacado',
    precoVarejo: round2(precoV),
    precoAtacado: round2(precoA),
    volumeVarejo: volV.valor,
    volumeAtacado: volA.valor,
    unidadeBase: volV.base,
    precoPorUnidadeVarejo: round2(puV),
    precoPorUnidadeAtacado: round2(puA),
    economiaPct,
    recomendacao,
    mensagem: msgFinal,
    volumeFamiliarPessoas: pessoas,
    economiaLiquida,
    unidadeAtacadoNome: uA?.nome ?? 'Atacado',
  };
}

async function buscarParesFamilia(
  produtoId: string,
  mercadoId: string,
  limite = 6
): Promise<string[]> {
  const prod = await prisma.produtos.findUnique({
    where: { id: produtoId },
    select: { nome: true, categoria: true },
  });
  if (!prod?.nome) return [];

  const familia = chaveFamilia(prod.nome);
  if (familia.length < 3) return [];

  const tokens = familia.split(' ').filter((t) => t.length >= 3);
  if (tokens.length === 0) return [];

  const candidatos = await prisma.produtos.findMany({
    where: {
      id: { not: produtoId },
      ativo: true,
      estoques: {
        some: {
          disponivel: true,
          quantidade: { gt: 0 },
          unidades: { mercadoId, ativa: true },
        },
      },
      AND: tokens.slice(0, 3).map((t) => ({
        nome: { contains: t, mode: 'insensitive' as const },
      })),
    },
    select: { id: true, nome: true, unidadeMedida: true },
    take: limite,
  });

  return candidatos.map((c) => c.id);
}

export async function listarAtacadoVarejoUsuario(
  userId: string,
  mercadoId: string,
  perfilPreci: unknown,
  limite = 5
): Promise<{
  itens: ComparativoAtacadoVarejo[];
  resumo: string;
  volumeFamiliarPessoas: number;
}> {
  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 60);

  const eventos = await EventCollector.getUserEvents(userId, mercadoId, inicio, fim);
  const pessoas = Math.max(
    parseVolumeFamiliar(perfilPreci),
    inferirPessoasDeEventos(eventos)
  );

  const freq = new Map<string, { count: number; qtd: number }>();
  for (const ev of eventos) {
    if (ev.type !== 'produto_adicionado_lista') continue;
    const pid = (ev.metadata as { produtoId?: string }).produtoId;
    const q = (ev.metadata as { quantidade?: number }).quantidade ?? 1;
    if (!pid) continue;
    const row = freq.get(pid) ?? { count: 0, qtd: 0 };
    row.count++;
    row.qtd += q;
    freq.set(pid, row);
  }

  const topIds = [...freq.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([id]) => id);

  const itens: ComparativoAtacadoVarejo[] = [];

  for (const pid of topIds) {
    const consumoSemanal = freq.has(pid)
      ? (freq.get(pid)!.qtd / Math.max(1, freq.get(pid)!.count)) * 1.5
      : null;

    const pares = await buscarParesFamilia(pid, mercadoId);
    const prodBase = await prisma.produtos.findUnique({
      where: { id: pid },
      select: { nome: true, unidadeMedida: true },
    });
    const volBase = extrairVolume(prodBase?.nome ?? '', prodBase?.unidadeMedida);

    for (const candidatoId of pares) {
      const prodC = await prisma.produtos.findUnique({
        where: { id: candidatoId },
        select: { nome: true, unidadeMedida: true },
      });
      const volC = extrairVolume(prodC?.nome ?? '', prodC?.unidadeMedida);
      if (volC.base !== volBase.base) continue;

      const [varejoId, atacadoId] =
        volC.valor > volBase.valor
          ? [pid, candidatoId]
          : volC.valor < volBase.valor
            ? [candidatoId, pid]
            : [null, null];
      if (!varejoId || !atacadoId) continue;

      const cmp = await compararParAtacadoVarejo(
        varejoId,
        atacadoId,
        mercadoId,
        pessoas,
        consumoSemanal,
        userId
      );
      if (cmp && cmp.recomendacao !== 'indiferente') {
        itens.push(cmp);
      }
    }
  }

  itens.sort((a, b) => b.economiaPct - a.economiaPct);
  const unicos = new Map<string, ComparativoAtacadoVarejo>();
  for (const i of itens) {
    const k = `${i.produtoVarejoId}:${i.produtoAtacadoId}`;
    if (!unicos.has(k)) unicos.set(k, i);
  }
  const lista = [...unicos.values()].slice(0, limite);

  const atacado = lista.filter((i) => i.recomendacao === 'atacado').length;
  const varejo = lista.filter((i) => i.recomendacao === 'varejo').length;

  let resumo = 'Compare pacotes maiores e menores nos itens que você mais compra.';
  if (atacado > 0 && varejo > 0) {
    resumo = `${atacado} item(ns) compensam atacado · ${varejo} melhor no varejo para sua casa.`;
  } else if (atacado > 0) {
    resumo = `${atacado} item(ns) com economia no formato maior para ~${pessoas} pessoas.`;
  } else if (varejo > 0) {
    resumo = `${varejo} item(ns) — varejo evita sobra para o tamanho da sua família.`;
  }

  return { itens: lista, resumo, volumeFamiliarPessoas: pessoas };
}

export async function analisarProdutoAtacadoVarejo(
  produtoId: string,
  mercadoId: string,
  perfilPreci: unknown,
  userId?: string
): Promise<ComparativoAtacadoVarejo | null> {
  let pessoas = parseVolumeFamiliar(perfilPreci);
  if (userId) {
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 60);
    const eventos = await EventCollector.getUserEvents(userId, mercadoId, inicio, fim);
    pessoas = Math.max(pessoas, inferirPessoasDeEventos(eventos));
  }

  const pares = await buscarParesFamilia(produtoId, mercadoId);
  const prod = await prisma.produtos.findUnique({
    where: { id: produtoId },
    select: { nome: true, unidadeMedida: true },
  });
  const volBase = extrairVolume(prod?.nome ?? '', prod?.unidadeMedida);

  let melhor: ComparativoAtacadoVarejo | null = null;
  for (const candidatoId of pares) {
    const prodC = await prisma.produtos.findUnique({
      where: { id: candidatoId },
      select: { nome: true, unidadeMedida: true },
    });
    const volC = extrairVolume(prodC?.nome ?? '', prodC?.unidadeMedida);
    if (volC.base !== volBase.base) continue;

    const [varejoId, atacadoId] =
      volC.valor > volBase.valor
        ? [produtoId, candidatoId]
        : volC.valor < volBase.valor
          ? [candidatoId, produtoId]
          : [null, null];
    if (!varejoId || !atacadoId) continue;

    const cmp = await compararParAtacadoVarejo(varejoId, atacadoId, mercadoId, pessoas, null, userId);
    if (cmp && (!melhor || cmp.economiaPct > melhor.economiaPct)) melhor = cmp;
  }
  return melhor;
}
