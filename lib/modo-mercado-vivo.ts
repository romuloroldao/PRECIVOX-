/**
 * Modo Mercado Ao Vivo — geofence + lista no corredor (Épico 8.1)
 */

import { prisma } from '@/lib/prisma';
import { haversineKm } from '@/lib/geo';

export const GEOFENCE_RAIO_METROS = 200;

export type DeteccaoMercadoVivo = {
  dentro: boolean;
  distanciaMetros: number;
  mercadoId: string;
  mercadoNome: string;
  unidadeId: string;
  unidadeNome: string;
  endereco: string | null;
  cidade: string | null;
};

export type ItemCorredor = {
  id: string;
  estoqueId: string;
  produtoId: string | null;
  nome: string;
  quantidade: number;
  precoExibido: number;
  emPromocao: boolean;
  disponivel: boolean;
  noMercadoAtual: boolean;
  precoLista: number;
};

function distanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return Math.round(haversineKm(lat1, lon1, lat2, lon2) * 1000);
}

export async function detectarMercadoVivo(
  lat: number,
  lon: number,
  raioMetros = GEOFENCE_RAIO_METROS
): Promise<DeteccaoMercadoVivo | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const unidades = await prisma.unidades.findMany({
    where: {
      ativa: true,
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      nome: true,
      endereco: true,
      cidade: true,
      latitude: true,
      longitude: true,
      mercadoId: true,
      mercados: { select: { id: true, nome: true } },
    },
    take: 200,
  });

  let melhor: {
    unidade: (typeof unidades)[0];
    distanciaMetros: number;
  } | null = null;

  for (const u of unidades) {
    if (u.latitude == null || u.longitude == null) continue;
    const d = distanciaMetros(lat, lon, u.latitude, u.longitude);
    if (d > raioMetros) continue;
    if (!melhor || d < melhor.distanciaMetros) {
      melhor = { unidade: u, distanciaMetros: d };
    }
  }

  if (!melhor) return null;

  const u = melhor.unidade;
  return {
    dentro: true,
    distanciaMetros: melhor.distanciaMetros,
    mercadoId: u.mercadoId,
    mercadoNome: u.mercados.nome,
    unidadeId: u.id,
    unidadeNome: u.nome,
    endereco: u.endereco,
    cidade: u.cidade,
  };
}

export async function sincronizarItensCorredor(
  mercadoId: string,
  itens: Array<{
    id: string;
    estoqueId: string;
    produtoCatalogoId?: string;
    nome: string;
    quantidade: number;
    preco: number;
    precoPromocional?: number;
    emPromocao: boolean;
    unidade?: { mercado?: { id: string } };
  }>
): Promise<ItemCorredor[]> {
  const produtoIds = [
    ...new Set(
      itens
        .map((i) => i.produtoCatalogoId)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const estoquesMercado =
    produtoIds.length > 0
      ? await prisma.estoques.findMany({
          where: {
            produtoId: { in: produtoIds },
            disponivel: true,
            unidades: { mercadoId, ativa: true },
          },
          select: {
            id: true,
            produtoId: true,
            preco: true,
            precoPromocional: true,
            emPromocao: true,
            quantidade: true,
          },
        })
      : [];

  const melhorPorProduto = new Map<string, (typeof estoquesMercado)[0]>();
  for (const e of estoquesMercado) {
    const preco = Number(
      e.emPromocao && e.precoPromocional ? e.precoPromocional : e.preco
    );
    const atual = melhorPorProduto.get(e.produtoId);
    if (!atual) {
      melhorPorProduto.set(e.produtoId, e);
      continue;
    }
    const precoAtual = Number(
      atual.emPromocao && atual.precoPromocional ? atual.precoPromocional : atual.preco
    );
    if (preco < precoAtual) melhorPorProduto.set(e.produtoId, e);
  }

  return itens.map((item) => {
    const pid = item.produtoCatalogoId;
    const est = pid ? melhorPorProduto.get(pid) : null;
    const noMercado = item.unidade?.mercado?.id === mercadoId || Boolean(est);
    const precoExibido = est
      ? Number(est.emPromocao && est.precoPromocional ? est.precoPromocional : est.preco)
      : item.emPromocao && item.precoPromocional
        ? item.precoPromocional
        : item.preco;

    return {
      id: item.id,
      estoqueId: est?.id ?? item.estoqueId,
      produtoId: pid ?? null,
      nome: item.nome,
      quantidade: item.quantidade,
      precoExibido,
      emPromocao: est?.emPromocao ?? item.emPromocao,
      disponivel: est ? (est.quantidade ?? 0) > 0 : noMercado,
      noMercadoAtual: noMercado,
      precoLista: item.emPromocao && item.precoPromocional ? item.precoPromocional : item.preco,
    };
  });
}
