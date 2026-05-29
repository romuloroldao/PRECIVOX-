/**
 * Estatísticas agregadas de rota multi-mercado (gestor) — Épico 11.3
 */

import { prisma } from '@/lib/prisma';

export type RotaMultiMercadoStats = {
  mercadoId: string;
  periodoDias: number;
  consolidacoesAceitas: number;
  consolidacoesDesfeitas: number;
  taxaAceitePct: number;
  deltaMedioAceito: number;
  mercadosEvitadosTotal: number;
  explicacao: string;
};

export async function getRotaMultiMercadoStats(
  mercadoId: string,
  dias = 30
): Promise<RotaMultiMercadoStats> {
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const eventos = await prisma.userEvent.findMany({
    where: {
      mercadoId,
      type: 'rota_consolidacao_lista',
      timestamp: { gte: desde },
    },
    select: { metadata: true },
  });

  let aceitas = 0;
  let desfeitas = 0;
  let deltaSum = 0;
  let mercadosEvitados = 0;

  for (const ev of eventos) {
    const m = ev.metadata as {
      acao?: string;
      deltaTotal?: number;
      mercadosAntes?: number;
      mercadosDepois?: number;
    };
    if (m.acao === 'aceita') {
      aceitas++;
      if (typeof m.deltaTotal === 'number') deltaSum += m.deltaTotal;
      if (typeof m.mercadosAntes === 'number' && typeof m.mercadosDepois === 'number') {
        mercadosEvitados += Math.max(0, m.mercadosAntes - m.mercadosDepois);
      }
    } else if (m.acao === 'desfeita') {
      desfeitas++;
    }
  }

  const total = aceitas + desfeitas;
  const taxaAceitePct = total > 0 ? Math.round((aceitas / total) * 1000) / 10 : 0;
  const deltaMedioAceito = aceitas > 0 ? Math.round((deltaSum / aceitas) * 100) / 100 : 0;

  return {
    mercadoId,
    periodoDias: dias,
    consolidacoesAceitas: aceitas,
    consolidacoesDesfeitas: desfeitas,
    taxaAceitePct,
    deltaMedioAceito,
    mercadosEvitadosTotal: mercadosEvitados,
    explicacao:
      'Consolidações de lista multi-mercado no app: quando o cliente aceita trocar itens para visitar menos lojas. Delta médio = diferença de preço na troca (pode ser positivo ou negativo).',
  };
}
