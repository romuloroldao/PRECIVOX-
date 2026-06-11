import { prisma } from '@/lib/prisma';
import { EventCollector } from '@/lib/ai/event-collector';
import { calcularChurnRisk } from './churn-scorer';
import { calcularElasticidadeUsuario } from './elasticidade-usuario';
import type { MlLeveSnapshot } from './types';
import { gravarMlLeveSnapshot } from './snapshot-store';

export type MlLeveBatchResumo = {
  processados: number;
  erros: number;
  ignorados: number;
};

export { lerMlLeveSnapshot } from './snapshot-store';

const DIAS_ANALISE = 60;
const LIMITE_PADRAO = 400;

/**
 * Job batch: persiste churn + elasticidade em `perfilPreci.mlLeve` por usuário/mercado.
 */
export async function executarMlLeveBatch(opts?: {
  limiteUsuarios?: number;
}): Promise<MlLeveBatchResumo> {
  const limite = opts?.limiteUsuarios ?? LIMITE_PADRAO;
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - DIAS_ANALISE);

  const grupos = await prisma.userEvent.groupBy({
    by: ['userId', 'mercadoId'],
    where: { timestamp: { gte: inicio } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limite,
  });

  let processados = 0;
  let erros = 0;
  let ignorados = 0;
  const fim = new Date();

  for (const g of grupos) {
    if (g._count.id < 3) {
      ignorados++;
      continue;
    }
    try {
      const eventos = await EventCollector.getUserEvents(g.userId, g.mercadoId, inicio, fim);
      const churn = calcularChurnRisk(eventos);
      const elasticidade = calcularElasticidadeUsuario(eventos);

      const snapshot: MlLeveSnapshot = {
        atualizadoEm: new Date().toISOString(),
        mercadoId: g.mercadoId,
        churn,
        elasticidade,
      };

      const user = await prisma.user.findUnique({
        where: { id: g.userId },
        select: { perfilPreci: true },
      });
      if (!user) {
        ignorados++;
        continue;
      }

      await prisma.user.update({
        where: { id: g.userId },
        data: {
          perfilPreci: gravarMlLeveSnapshot(user.perfilPreci, snapshot) as object,
        },
      });
      processados++;
    } catch (e) {
      console.error('[ml-leve/batch]', g.userId, e);
      erros++;
    }
  }

  return { processados, erros, ignorados };
}
