/**
 * Agregação hiperlocal CEP5 / polígono de bairro (Épico 11.1)
 */

import { prisma } from '@/lib/prisma';
import { haversineKm } from '@/lib/geo';

/** Extrai os 5 primeiros dígitos do CEP brasileiro (faixa de bairro). */
export function extrairCep5(cep: string | null | undefined): string | null {
  if (!cep?.trim()) return null;
  const digits = cep.replace(/\D/g, '');
  if (digits.length < 5) return null;
  return digits.slice(0, 5);
}

export type PoligonoBairro = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

export function pontoDentroPoligono(lat: number, lon: number, p: PoligonoBairro): boolean {
  return lat >= p.minLat && lat <= p.maxLat && lon >= p.minLon && lon <= p.maxLon;
}

/** Bounding box das unidades ativas no mesmo CEP5 (+ padding). */
export async function construirPoligonoBairroCep5(cep5: string): Promise<PoligonoBairro | null> {
  const rows = await prisma.unidades.findMany({
    where: {
      ativa: true,
      latitude: { not: null },
      longitude: { not: null },
      cep: { not: null },
    },
    select: { cep: true, latitude: true, longitude: true },
  });

  const pts = rows.filter(
    (r) => extrairCep5(r.cep) === cep5 && r.latitude != null && r.longitude != null
  );

  if (pts.length === 0) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const p of pts) {
    minLat = Math.min(minLat, p.latitude!);
    maxLat = Math.max(maxLat, p.latitude!);
    minLon = Math.min(minLon, p.longitude!);
    maxLon = Math.max(maxLon, p.longitude!);
  }

  const padLat = Math.max(0.004, (maxLat - minLat) * 0.12);
  const padLon = Math.max(0.004, (maxLon - minLon) * 0.12);

  return {
    minLat: minLat - padLat,
    maxLat: maxLat + padLat,
    minLon: minLon - padLon,
    maxLon: maxLon + padLon,
  };
}

/** Polígono quadrado ~1,5 km em torno da unidade de referência. */
export async function construirPoligonoMercado(mercadoId: string): Promise<PoligonoBairro | null> {
  const u = await prisma.unidades.findFirst({
    where: { mercadoId, ativa: true, latitude: { not: null }, longitude: { not: null } },
    select: { latitude: true, longitude: true },
  });
  if (u?.latitude == null || u?.longitude == null) return null;

  const delta = 0.0135;
  return {
    minLat: u.latitude - delta,
    maxLat: u.latitude + delta,
    minLon: u.longitude - delta,
    maxLon: u.longitude + delta,
  };
}

export async function obterCep5Mercado(mercadoId: string): Promise<string | null> {
  const u = await prisma.unidades.findFirst({
    where: { mercadoId },
    orderBy: { dataCriacao: 'asc' },
    select: { cep: true },
  });
  return extrairCep5(u?.cep);
}

/** Lista IDs de unidades ativas com coordenadas dentro do raio (km) do ponto de referência. */
export async function listarUnidadeIdsNoRaioKm(
  lat: number,
  lon: number,
  raioKm: number
): Promise<string[]> {
  const raio = Math.min(200, Math.max(1, raioKm));
  const rows = await prisma.unidades.findMany({
    where: {
      ativa: true,
      latitude: { not: null },
      longitude: { not: null },
    },
    select: { id: true, latitude: true, longitude: true },
  });

  return rows
    .filter((r) => {
      if (r.latitude == null || r.longitude == null) return false;
      return haversineKm(lat, lon, r.latitude, r.longitude) <= raio;
    })
    .map((r) => r.id);
}

export async function listarUnidadeIdsNoCep5(cep5: string): Promise<string[]> {
  const rows = await prisma.unidades.findMany({
    where: { ativa: true, cep: { not: null } },
    select: { id: true, cep: true },
  });

  return rows.filter((r) => extrairCep5(r.cep) === cep5).map((r) => r.id);
}

export async function listarUnidadeIdsNoPoligono(poligono: PoligonoBairro): Promise<string[]> {
  const rows = await prisma.unidades.findMany({
    where: {
      ativa: true,
      latitude: { not: null },
      longitude: { not: null },
    },
    select: { id: true, latitude: true, longitude: true },
  });

  return rows
    .filter(
      (r) =>
        r.latitude != null &&
        r.longitude != null &&
        pontoDentroPoligono(r.latitude, r.longitude, poligono)
    )
    .map((r) => r.id);
}

export type UnidadesRefPreco =
  | { tipo: 'ids'; ids: string[] }
  | { tipo: 'prisma_unidades'; where: { estado: string; cidade?: string } };

export type CtxRegiaoPrecoEfetivo =
  | 'cidade'
  | 'ampla'
  | 'proximidade'
  | 'cep5'
  | 'poligono';

export type CtxRegiaoPreco = {
  efetivo: CtxRegiaoPrecoEfetivo;
  estado: string | null;
  cidade: string | null;
  cep5?: string | null;
  bairro?: string | null;
};

export async function resolverUnidadesReferenciaPreco(
  mercadoId: string,
  ctx: CtxRegiaoPreco,
  raioKm: number
): Promise<UnidadesRefPreco | null> {
  const { sincronizarGeocodificacaoUnidade } = await import('@/lib/unidade-geocode');

  if (ctx.efetivo === 'cep5') {
    const cep5 = ctx.cep5 ?? (await obterCep5Mercado(mercadoId));
    if (!cep5) return null;
    const ids = await listarUnidadeIdsNoCep5(cep5);
    if (ids.length === 0) return null;
    return { tipo: 'ids', ids };
  }

  if (ctx.efetivo === 'poligono') {
    const cep5 = ctx.cep5 ?? (await obterCep5Mercado(mercadoId));
    const poligono = cep5
      ? await construirPoligonoBairroCep5(cep5)
      : await construirPoligonoMercado(mercadoId);
    if (!poligono) return null;
    const ids = await listarUnidadeIdsNoPoligono(poligono);
    if (ids.length === 0) return null;
    return { tipo: 'ids', ids };
  }

  if (ctx.efetivo === 'proximidade') {
    let u = await prisma.unidades.findFirst({
      where: { mercadoId },
      orderBy: { dataCriacao: 'asc' },
      select: { id: true, latitude: true, longitude: true, estado: true },
    });

    if (u && (u.latitude == null || u.longitude == null)) {
      await sincronizarGeocodificacaoUnidade(u.id);
      u = await prisma.unidades.findFirst({
        where: { id: u.id },
        select: { id: true, latitude: true, longitude: true, estado: true },
      });
    }

    if (!u?.latitude || !u?.longitude) {
      return null;
    }

    const ids = await listarUnidadeIdsNoRaioKm(u.latitude, u.longitude, raioKm);
    if (ids.length === 0) return null;
    return { tipo: 'ids', ids };
  }

  if (!ctx.estado) {
    return null;
  }

  if (ctx.efetivo === 'cidade' && ctx.cidade) {
    return { tipo: 'prisma_unidades', where: { estado: ctx.estado, cidade: ctx.cidade } };
  }

  return { tipo: 'prisma_unidades', where: { estado: ctx.estado } };
}

/** Monta contexto geo a partir do resultado resolvido (com fallbacks). */
export function toCtxRegiaoPreco(resolvido: {
  efetivo: CtxRegiaoPrecoEfetivo;
  estado: string | null;
  cidade: string | null;
  cep5?: string | null;
  bairro?: string | null;
}): CtxRegiaoPreco {
  return {
    efetivo: resolvido.efetivo,
    estado: resolvido.estado,
    cidade: resolvido.cidade,
    cep5: resolvido.cep5 ?? null,
    bairro: resolvido.bairro ?? null,
  };
}
