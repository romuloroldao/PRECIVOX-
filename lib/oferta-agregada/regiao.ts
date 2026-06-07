import { prisma } from '@/lib/prisma';
import {
  construirPoligonoBairroCep5,
  construirPoligonoMercado,
  listarUnidadeIdsNoCep5,
  listarUnidadeIdsNoPoligono,
  obterCep5Mercado,
} from '@/lib/regiao-preco-unidades';
import type { RegiaoOfertaModo } from './types';

export type RegiaoOfertaCtx = {
  mercadoIds: string[];
  descricao: string;
};

export async function resolverRegiaoOferta(
  mercadoReferenciaId: string,
  modo: RegiaoOfertaModo
): Promise<RegiaoOfertaCtx> {
  if (modo === 'cidade') {
    const ref = await prisma.unidades.findFirst({
      where: { mercadoId: mercadoReferenciaId, ativa: true },
      orderBy: { dataCriacao: 'asc' },
      select: { cidade: true, estado: true },
    });
    if (!ref?.cidade || !ref.estado) {
      return { mercadoIds: [mercadoReferenciaId], descricao: 'Mercado isolado (sem cidade cadastrada)' };
    }
    const rows = await prisma.unidades.findMany({
      where: { ativa: true, cidade: ref.cidade, estado: ref.estado },
      select: { mercadoId: true },
    });
    const mercadoIds = [...new Set(rows.map((r) => r.mercadoId))];
    return {
      mercadoIds: mercadoIds.length ? mercadoIds : [mercadoReferenciaId],
      descricao: `${ref.cidade}/${ref.estado}`,
    };
  }

  if (modo === 'poligono') {
    const cep5 = await obterCep5Mercado(mercadoReferenciaId);
    const poligono = cep5
      ? await construirPoligonoBairroCep5(cep5)
      : await construirPoligonoMercado(mercadoReferenciaId);
    if (!poligono) {
      return { mercadoIds: [mercadoReferenciaId], descricao: 'Polígono indisponível — só este mercado' };
    }
    const unidadeIds = await listarUnidadeIdsNoPoligono(poligono);
    const rows = await prisma.unidades.findMany({
      where: { id: { in: unidadeIds } },
      select: { mercadoId: true },
    });
    const mercadoIds = [...new Set(rows.map((r) => r.mercadoId))];
    return {
      mercadoIds: mercadoIds.length ? mercadoIds : [mercadoReferenciaId],
      descricao: cep5 ? `Bairro CEP ${cep5}` : 'Raio ~1,5 km',
    };
  }

  const cep5 = await obterCep5Mercado(mercadoReferenciaId);
  if (!cep5) {
    return { mercadoIds: [mercadoReferenciaId], descricao: 'CEP5 indisponível — só este mercado' };
  }
  const unidadeIds = await listarUnidadeIdsNoCep5(cep5);
  const rows = await prisma.unidades.findMany({
    where: { id: { in: unidadeIds } },
    select: { mercadoId: true },
  });
  const mercadoIds = [...new Set(rows.map((r) => r.mercadoId))];
  return {
    mercadoIds: mercadoIds.length ? mercadoIds : [mercadoReferenciaId],
    descricao: `CEP5 ${cep5}`,
  };
}
