import { prisma } from '@/lib/prisma';
import type { MlLeveResumoMercado } from './types';
import { lerMlLeveSnapshot } from './snapshot-store';

/**
 * Agrega snapshots batch do Épico 12 para o painel do gestor.
 */
export async function getMlLeveResumoMercado(mercadoId: string): Promise<MlLeveResumoMercado> {
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 60);

  const userIds = await prisma.userEvent.findMany({
    where: { mercadoId, timestamp: { gte: inicio } },
    distinct: ['userId'],
    select: { userId: true },
    take: 2000,
  });

  if (!userIds.length) {
    return {
      usuariosAnalisados: 0,
      churnAlto: 0,
      churnMedio: 0,
      elasticidadeMedia: -1.2,
      explicacao: 'Ainda não há eventos suficientes para ML leve neste mercado.',
      acoesSugeridas: [
        'Incentive clientes a usar lista e confirmação de compra',
        'Rode o batch noturno ou POST /api/cron/ml-leve-batch',
      ],
    };
  }

  const users = await prisma.user.findMany({
    where: { id: { in: userIds.map((u) => u.userId) } },
    select: { id: true, perfilPreci: true },
  });

  let churnAlto = 0;
  let churnMedio = 0;
  let somaElasticidade = 0;
  let comSnapshot = 0;

  for (const u of users) {
    const snap = lerMlLeveSnapshot(u.perfilPreci, mercadoId);
    if (!snap) continue;
    comSnapshot++;
    if (snap.churn.nivel === 'alto') churnAlto++;
    else if (snap.churn.nivel === 'medio') churnMedio++;
    somaElasticidade += snap.elasticidade.coeficiente;
  }

  const elasticidadeMedia =
    comSnapshot > 0 ? Math.round((somaElasticidade / comSnapshot) * 100) / 100 : -1.2;

  const acoesSugeridas: string[] = [];
  if (churnAlto > 0) {
    acoesSugeridas.push(
      `${churnAlto} cliente(s) com risco alto de churn — ative push de cesta ou promo direcionada`
    );
  }
  if (elasticidadeMedia <= -1.6) {
    acoesSugeridas.push('Base sensível a preço — priorize promoções e benchmark regional');
  }
  if (!acoesSugeridas.length) {
    acoesSugeridas.push('Base engajada — mantenha catálogo fresco e radar de demanda');
  }

  return {
    usuariosAnalisados: comSnapshot || userIds.length,
    churnAlto,
    churnMedio,
    elasticidadeMedia,
    explicacao:
      'Resumo do batch ML leve (churn heurístico + elasticidade por usuário). Atualize com o job diário.',
    acoesSugeridas,
  };
}
