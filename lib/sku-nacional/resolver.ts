import { prisma } from '@/lib/prisma';
import { computeCamposChaveProduto } from '@/lib/produtos-chaves';
import type { ResumoSkuNacional, OfertaSkuNacional } from '@/lib/sku-nacional/types';
import { labelSkuNacional } from '@/lib/sku-nacional/compute';

export async function buscarOfertasPorSkuNacional(
  skuNacional: string,
  opts?: { excluirMercadoId?: string; limit?: number }
): Promise<ResumoSkuNacional> {
  const limit = Math.min(opts?.limit ?? 24, 40);
  const produtos = await prisma.produtos.findMany({
    where: {
      skuNacional,
      ativo: true,
      ...(opts?.excluirMercadoId
        ? {
            NOT: {
              estoques: {
                some: {
                  unidades: { mercadoId: opts.excluirMercadoId },
                },
              },
            },
          }
        : {}),
    },
    take: limit * 2,
    select: {
      id: true,
      nome: true,
      marca: true,
      estoques: {
        where: { disponivel: true, quantidade: { gt: 0 } },
        orderBy: [{ emPromocao: 'desc' }, { preco: 'asc' }],
        take: 1,
        select: {
          id: true,
          preco: true,
          precoPromocional: true,
          emPromocao: true,
          unidades: {
            select: {
              mercados: { select: { id: true, nome: true } },
            },
          },
        },
      },
    },
  });

  const ofertas: OfertaSkuNacional[] = [];
  const mercadosVistos = new Set<string>();

  for (const p of produtos) {
    const est = p.estoques[0];
    if (!est) continue;
    const mercadoId = est.unidades?.mercados?.id ?? '';
    if (!mercadoId || mercadosVistos.has(mercadoId)) continue;
    mercadosVistos.add(mercadoId);

    const preco = Number(est.preco);
    const promo = est.precoPromocional != null ? Number(est.precoPromocional) : null;
    const precoEfetivo = est.emPromocao && promo != null ? promo : preco;

    ofertas.push({
      mercadoId,
      mercadoNome: est.unidades?.mercados?.nome ?? 'Mercado',
      produtoId: p.id,
      estoqueId: est.id,
      nome: p.nome,
      precoEfetivo,
      emPromocao: est.emPromocao,
    });
    if (ofertas.length >= limit) break;
  }

  ofertas.sort((a, b) => a.precoEfetivo - b.precoEfetivo);
  const precos = ofertas.map((o) => o.precoEfetivo);

  return {
    skuNacional,
    label: labelSkuNacional({ nome: produtos[0]?.nome ?? 'Produto', marca: produtos[0]?.marca }),
    mercados: ofertas.length,
    ofertas,
    precoMin: precos.length ? Math.min(...precos) : null,
    precoMax: precos.length ? Math.max(...precos) : null,
  };
}

export async function resolverSkuPorProdutoId(
  produtoId: string
): Promise<{ skuNacional: string | null; resumo: ResumoSkuNacional | null }> {
  const p = await prisma.produtos.findUnique({
    where: { id: produtoId },
    select: {
      skuNacional: true,
      estoques: {
        take: 1,
        select: { unidades: { select: { mercadoId: true } } },
      },
    },
  });
  if (!p?.skuNacional) return { skuNacional: null, resumo: null };

  const mercadoLocal = p.estoques[0]?.unidades?.mercadoId;
  const resumo = await buscarOfertasPorSkuNacional(p.skuNacional, {
    excluirMercadoId: mercadoLocal ?? undefined,
    limit: 12,
  });
  return { skuNacional: p.skuNacional, resumo };
}

export async function backfillSkuNacionalBatch(opts?: {
  take?: number;
  skip?: number;
}): Promise<{ processados: number; restantes: number }> {
  const take = Math.min(opts?.take ?? 500, 2000);
  const skip = opts?.skip ?? 0;

  const rows = await prisma.produtos.findMany({
    skip,
    take,
    orderBy: { id: 'asc' },
    select: {
      id: true,
      nome: true,
      codigoBarras: true,
      marca: true,
      categoria: true,
    },
  });

  for (const p of rows) {
    const campos = computeCamposChaveProduto({
      nome: p.nome,
      codigoBarras: p.codigoBarras,
      marca: p.marca,
      categoria: p.categoria,
    });
    await prisma.produtos.update({
      where: { id: p.id },
      data: {
        nomeChave: campos.nomeChave,
        chaveInsight: campos.chaveInsight,
        skuNacional: campos.skuNacional,
        embeddingJson: campos.embeddingJson,
        dataAtualizacao: new Date(),
      },
    });
  }

  const restantes = await prisma.produtos.count({
    where: {
      OR: [{ skuNacional: null }, { skuNacional: '' }],
    },
  });

  return { processados: rows.length, restantes };
}
