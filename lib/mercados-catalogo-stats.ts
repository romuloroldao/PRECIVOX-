import { prisma } from '@/lib/prisma';

export type MercadoCatalogoStat = {
  id: string;
  nome: string;
  produtosComEstoque: number;
  ofertas: number;
};

export type CatalogoResumo = {
  mercados: MercadoCatalogoStat[];
  totais: {
    mercadosAtivos: number;
    produtosUnicosGlobal: number;
    produtosCatalogoIsolado: number;
    ofertasTotal: number;
  };
  explicacao: string;
};

/**
 * Contagens reais por mercado (produtos distintos vs linhas de estoque).
 */
export async function getCatalogoResumoMercados(): Promise<CatalogoResumo> {
  const mercados = await prisma.mercados.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' },
  });

  const mercadosStats: MercadoCatalogoStat[] = [];
  for (const m of mercados) {
    const [produtosComEstoque, ofertas] = await Promise.all([
      prisma.produtos.count({
        where: {
          ativo: true,
          estoques: { some: { unidades: { mercadoId: m.id, ativa: true } } },
        },
      }),
      prisma.estoques.count({
        where: { unidades: { mercadoId: m.id, ativa: true, mercados: { ativo: true } } },
      }),
    ]);
    mercadosStats.push({
      id: m.id,
      nome: m.nome,
      produtosComEstoque,
      ofertas,
    });
  }

  const [produtosUnicosGlobal, ofertasTotal] = await Promise.all([
    prisma.produtos.count({
      where: {
        ativo: true,
        estoques: { some: { unidades: { ativa: true, mercados: { ativo: true } } } },
      },
    }),
    prisma.estoques.count({
      where: { unidades: { ativa: true, mercados: { ativo: true } } },
    }),
  ]);
  const produtosCatalogoIsolado = 0;

  return {
    mercados: mercadosStats,
    totais: {
      mercadosAtivos: mercados.length,
      produtosUnicosGlobal,
      produtosCatalogoIsolado,
      ofertasTotal,
    },
    explicacao:
      'Com catálogo isolado (seed-v3), cada mercado tem seus próprios SKUs — o total de produtos únicos pode ser a soma por rede (~5.500 × N mercados). Ofertas = linhas de estoque/preço.',
  };
}
