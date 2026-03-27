import { prisma } from '@/lib/prisma';
import { haversineKm } from '@/lib/geo';

/** Lista IDs de unidades ativas com coordenadas dentro do raio (km) do ponto de referência. */
export async function listarUnidadeIdsNoRaioKm(
  lat: number,
  lon: number,
  raioKm: number
): Promise<string[]> {
  const raio = Math.min(200, Math.max(1, raioKm));
  const where: Parameters<typeof prisma.unidades.findMany>[0]['where'] = {
    ativa: true,
    latitude: { not: null },
    longitude: { not: null },
  };

  const rows = await prisma.unidades.findMany({
    where,
    select: { id: true, latitude: true, longitude: true },
  });

  return rows
    .filter((r) => {
      if (r.latitude == null || r.longitude == null) return false;
      return haversineKm(lat, lon, r.latitude, r.longitude) <= raio;
    })
    .map((r) => r.id);
}

export type UnidadesRefPreco =
  | { tipo: 'ids'; ids: string[] }
  | { tipo: 'prisma_unidades'; where: { estado: string; cidade?: string } };

/**
 * Resolve quais unidades entram na referência de preço (cidade, ampliada ou proximidade).
 * Proximidade exige coordenadas; tenta geocodificar a primeira unidade do mercado se faltar.
 */
export type CtxRegiaoPreco = {
  efetivo: 'cidade' | 'ampla' | 'proximidade';
  estado: string | null;
  cidade: string | null;
};

export async function resolverUnidadesReferenciaPreco(
  mercadoId: string,
  ctx: CtxRegiaoPreco,
  raioKm: number
): Promise<UnidadesRefPreco | null> {
  const { sincronizarGeocodificacaoUnidade } = await import('@/lib/unidade-geocode');

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

    if (ids.length === 0) {
      return null;
    }

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
