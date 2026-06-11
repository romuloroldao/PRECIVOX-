import { prisma } from '@/lib/prisma';
import { MONETIZACAO_PADRAO, type MonetizacaoMercado, type PromoDirecionada } from './types';

export function parseMonetizacao(raw: unknown): MonetizacaoMercado {
  if (!raw || typeof raw !== 'object') return { ...MONETIZACAO_PADRAO, promosDirecionadas: [] };
  const o = raw as Record<string, unknown>;
  const promos = Array.isArray(o.promosDirecionadas)
    ? (o.promosDirecionadas as PromoDirecionada[])
    : [];
  return {
    promosDirecionadas: promos.filter((p) => p && typeof p.id === 'string'),
    notasComerciais:
      typeof o.notasComerciais === 'string' ? o.notasComerciais.slice(0, 500) : undefined,
  };
}

export async function obterMonetizacaoMercado(mercadoId: string): Promise<MonetizacaoMercado> {
  const m = await prisma.mercados.findUnique({
    where: { id: mercadoId },
    select: { monetizacao: true },
  });
  return parseMonetizacao(m?.monetizacao);
}

export async function salvarMonetizacaoMercado(
  mercadoId: string,
  patch: Partial<MonetizacaoMercado>
): Promise<MonetizacaoMercado> {
  const atual = await obterMonetizacaoMercado(mercadoId);
  const merged: MonetizacaoMercado = {
    ...atual,
    ...patch,
    promosDirecionadas: patch.promosDirecionadas ?? atual.promosDirecionadas,
  };
  await prisma.mercados.update({
    where: { id: mercadoId },
    data: { monetizacao: merged as object, dataAtualizacao: new Date() },
  });
  return merged;
}
