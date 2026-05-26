/**
 * Saúde do catálogo do mercado (gestor) — Sprint 1
 */

import { prisma } from '@/lib/prisma';

const DIAS_STALE = 7;

export type CatalogoSaude = {
  mercadoId: string;
  totalSkus: number;
  skusStale: number;
  pctStale: number;
  ultimoImport: {
    nomeArquivo: string;
    status: string;
    dataInicio: Date;
    dataFim: Date | null;
    linhasSucesso: number;
    linhasErro: number;
  } | null;
  confiancaMedia: number | null;
  recomendacao: string;
};

export async function getCatalogoSaude(mercadoId: string): Promise<CatalogoSaude> {
  const limite = new Date();
  limite.setDate(limite.getDate() - DIAS_STALE);

  const unidades = await prisma.unidades.findMany({
    where: { mercadoId, ativa: true },
    select: { id: true },
  });
  const unidadeIds = unidades.map((u) => u.id);

  const [totalSkus, skusStale, aggConf, ultimoImport] = await Promise.all([
    unidadeIds.length === 0
      ? 0
      : prisma.estoques.count({ where: { unidadeId: { in: unidadeIds } } }),
    unidadeIds.length === 0
      ? 0
      : prisma.estoques.count({
          where: {
            unidadeId: { in: unidadeIds },
            atualizadoEm: { lt: limite },
          },
        }),
    unidadeIds.length === 0
      ? { _avg: { confianca: null as number | null } }
      : prisma.estoques.aggregate({
          where: { unidadeId: { in: unidadeIds } },
          _avg: { confianca: true },
        }),
    prisma.logs_importacao.findFirst({
      where: { mercadoId },
      orderBy: { dataInicio: 'desc' },
    }),
  ]);

  const pctStale = totalSkus > 0 ? Math.round((skusStale / totalSkus) * 100) : 0;
  const confiancaMedia =
    aggConf._avg.confianca != null ? Math.round(aggConf._avg.confianca) : null;

  let recomendacao = 'Catálogo em dia. Mantenha importações semanais.';
  if (totalSkus === 0) {
    recomendacao = 'Nenhum produto no catálogo. Faça o primeiro upload na área de produtos.';
  } else if (pctStale >= 40) {
    recomendacao = `Mais de ${pctStale}% dos preços não são atualizados há ${DIAS_STALE}+ dias. Reimporte o catálogo.`;
  } else if (pctStale >= 15) {
    recomendacao = 'Parte do catálogo está desatualizada. Agende uma reimportação esta semana.';
  } else if (!ultimoImport) {
    recomendacao = 'Ainda não há histórico de importação registrado.';
  }

  return {
    mercadoId,
    totalSkus,
    skusStale,
    pctStale,
    ultimoImport: ultimoImport
      ? {
          nomeArquivo: ultimoImport.nomeArquivo,
          status: ultimoImport.status,
          dataInicio: ultimoImport.dataInicio,
          dataFim: ultimoImport.dataFim,
          linhasSucesso: ultimoImport.linhasSucesso,
          linhasErro: ultimoImport.linhasErro,
        }
      : null,
    confiancaMedia,
    recomendacao,
  };
}
