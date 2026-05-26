/**
 * Radar de demanda do bairro (agregado, anônimo) — Sprint 3
 */

import { prisma } from '@/lib/prisma';

export type RadarDemandaItem = {
  produtoId: string;
  nome: string;
  categoria: string | null;
  listasAtivas: number;
  buscasRecentes: number;
  pressao: 'ALTA' | 'MEDIA';
};

export async function getRadarDemandaMercado(
  mercadoId: string,
  dias = 7
): Promise<{
  mercadoId: string;
  periodoDias: number;
  itens: RadarDemandaItem[];
  totalSinais: number;
  explicacao: string;
}> {
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const eventos = await prisma.userEvent.findMany({
    where: {
      mercadoId,
      timestamp: { gte: desde },
      type: { in: ['produto_adicionado_lista', 'produto_buscado'] },
    },
    select: { type: true, metadata: true, userId: true },
  });

  const adds = new Map<string, Set<string>>();
  const buscas = new Map<string, number>();

  for (const ev of eventos) {
    const meta = ev.metadata as { produtoId?: string; searchQuery?: string };
    if (ev.type === 'produto_adicionado_lista' && meta.produtoId) {
      if (!adds.has(meta.produtoId)) adds.set(meta.produtoId, new Set());
      adds.get(meta.produtoId)!.add(ev.userId);
    }
    if (ev.type === 'produto_buscado' && meta.searchQuery) {
      const k = meta.searchQuery.toLowerCase().slice(0, 80);
      buscas.set(k, (buscas.get(k) ?? 0) + 1);
    }
  }

  const topIds = [...adds.entries()]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 15)
    .map(([id]) => id);

  const produtos = await prisma.produtos.findMany({
    where: { id: { in: topIds } },
    select: { id: true, nome: true, categoria: true },
  });

  const itens: RadarDemandaItem[] = produtos.map((p) => {
    const listas = adds.get(p.id)?.size ?? 0;
    return {
      produtoId: p.id,
      nome: p.nome ?? 'Produto',
      categoria: p.categoria,
      listasAtivas: listas,
      buscasRecentes: 0,
      pressao: listas >= 5 ? 'ALTA' : 'MEDIA',
    };
  });

  itens.sort((a, b) => b.listasAtivas - a.listasAtivas);

  return {
    mercadoId,
    periodoDias: dias,
    itens,
    totalSinais: eventos.length,
    explicacao:
      'Demanda latente: famílias com listas ativas no PRECIVOX (dados agregados, sem identificar consumidores).',
  };
}
