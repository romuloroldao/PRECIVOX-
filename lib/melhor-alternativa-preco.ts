/**
 * Melhor alternativa de preço para o mesmo produto (região / mesma cidade).
 */

import { prisma } from '@/lib/prisma';
import {
  calcularEconomiaLiquida,
  distanciaKmEntreCoords,
  type ResultadoEconomiaLiquida,
} from '@/lib/economia-liquida';

export type MelhorAlternativa = {
  estoqueId: string;
  preco: number;
  precoPromocional: number | null;
  emPromocao: boolean;
  unidade: {
    id: string;
    nome: string;
    latitude: number | null;
    longitude: number | null;
    mercado: { id: string; nome: string };
  };
  distanciaKm: number | null;
  economiaLiquida: ResultadoEconomiaLiquida;
};

function precoEfetivo(preco: number, promo: number | null, emPromo: boolean): number {
  if (emPromo && promo != null) return promo;
  return preco;
}

export async function buscarMelhorAlternativa(
  produtoCatalogoId: string,
  unidadeOrigemId: string,
  precoOrigemEfetivo: number,
  userId?: string
): Promise<MelhorAlternativa | null> {
  if (precoOrigemEfetivo <= 0) return null;

  const { getElCalcularOpts } = await import('@/lib/el-config-usuario-server');
  const elOpts = await getElCalcularOpts(userId);

  const origem = await prisma.unidades.findUnique({
    where: { id: unidadeOrigemId },
    select: {
      id: true,
      cidade: true,
      estado: true,
      latitude: true,
      longitude: true,
      mercadoId: true,
    },
  });
  if (!origem) return null;

  const candidatos = await prisma.estoques.findMany({
    where: {
      produtoId: produtoCatalogoId,
      disponivel: true,
      quantidade: { gt: 0 },
      unidadeId: { not: unidadeOrigemId },
      unidades: origem.cidade
        ? { cidade: origem.cidade, ...(origem.estado ? { estado: origem.estado } : {}) }
        : undefined,
    },
    orderBy: [{ emPromocao: 'desc' }, { preco: 'asc' }],
    take: 8,
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

  let melhor: MelhorAlternativa | null = null;

  for (const est of candidatos) {
    const u = est.unidades;
    if (!u) continue;
    const precoDest = precoEfetivo(
      est.preco.toNumber(),
      est.precoPromocional?.toNumber() ?? null,
      est.emPromocao
    );
    if (precoDest >= precoOrigemEfetivo) continue;

    let distanciaKm: number | null = null;
    if (
      origem.latitude != null &&
      origem.longitude != null &&
      u.latitude != null &&
      u.longitude != null
    ) {
      distanciaKm = distanciaKmEntreCoords(
        origem.latitude,
        origem.longitude,
        u.latitude,
        u.longitude
      );
    }

    const economiaLiquida = calcularEconomiaLiquida({
      precoOrigem: precoOrigemEfetivo,
      precoDestino: precoDest,
      distanciaKm,
      ...elOpts,
    });

    if (!melhor || economiaLiquida.economiaLiquida > melhor.economiaLiquida.economiaLiquida) {
      melhor = {
        estoqueId: est.id,
        preco: est.preco.toNumber(),
        precoPromocional: est.precoPromocional?.toNumber() ?? null,
        emPromocao: est.emPromocao,
        unidade: {
          id: u.id,
          nome: u.nome ?? 'Unidade',
          latitude: u.latitude,
          longitude: u.longitude,
          mercado: {
            id: u.mercados?.id ?? '',
            nome: u.mercados?.nome ?? 'Mercado',
          },
        },
        distanciaKm,
        economiaLiquida,
      };
    }
  }

  return melhor;
}
