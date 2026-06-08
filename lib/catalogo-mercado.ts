/**
 * Catálogo isolado por mercado — produtos com `mercadoId` não são compartilhados entre redes.
 */

import { prisma } from '@/lib/prisma';
import { computeCamposChaveProduto } from '@/lib/produtos-chaves';
import { computeSkuNacionalFields } from '@/lib/sku-nacional/compute';

export function catalogoIsoladoPorMercado(): boolean {
  return process.env.CATALOGO_ISOLADO_POR_MERCADO !== 'false';
}

type ProdutoRow = {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  codigoBarras: string | null;
  marca: string | null;
  unidadeMedida: string | null;
  mercadoId: string | null;
};

export async function buscarProdutoNoCatalogo(
  mercadoId: string,
  dados: { nome: string; codigoBarras?: string; marca?: string }
): Promise<ProdutoRow | null> {
  const isolado = catalogoIsoladoPorMercado();

  if (dados.codigoBarras) {
    const porCodigo = await prisma.produtos.findFirst({
      where: isolado
        ? { mercadoId, codigoBarras: dados.codigoBarras }
        : { codigoBarras: dados.codigoBarras },
    });
    if (porCodigo) return porCodigo as ProdutoRow;
  }

  const porNome = await prisma.produtos.findFirst({
    where: {
      ...(isolado ? { mercadoId } : {}),
      nome: { equals: dados.nome, mode: 'insensitive' },
      ...(dados.marca
        ? { marca: { equals: dados.marca, mode: 'insensitive' } }
        : { marca: null }),
    },
  });
  return (porNome as ProdutoRow) ?? null;
}

/** Cria produto no catálogo do mercado (isolado quando feature ativa). */
export async function criarProdutoCatalogoMercado(
  mercadoId: string,
  dados: {
    nome: string;
    descricao?: string;
    categoria?: string;
    codigoBarras?: string;
    marca?: string;
    unidadeMedida?: string;
  }
): Promise<ProdutoRow> {
  const isolado = catalogoIsoladoPorMercado();
  const chaves = computeCamposChaveProduto({
    nome: dados.nome,
    codigoBarras: dados.codigoBarras || null,
    marca: dados.marca || null,
    categoria: dados.categoria || null,
  });
  const sku = computeSkuNacionalFields({
    nome: dados.nome,
    codigoBarras: dados.codigoBarras || null,
    marca: dados.marca || null,
    categoria: dados.categoria || null,
    chaveInsight: chaves.chaveInsight,
  });

  return prisma.produtos.create({
    data: {
      id: `prod-${mercadoId.slice(-6)}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      mercadoId: isolado ? mercadoId : null,
      nome: dados.nome,
      descricao: dados.descricao,
      categoria: dados.categoria,
      codigoBarras: dados.codigoBarras || null,
      marca: dados.marca || null,
      unidadeMedida: dados.unidadeMedida || 'UN',
      nomeChave: chaves.nomeChave,
      chaveInsight: chaves.chaveInsight,
      skuNacional: sku.skuNacional,
      embeddingJson: sku.embeddingJson,
      ativo: true,
      dataCriacao: new Date(),
      dataAtualizacao: new Date(),
    },
  }) as Promise<ProdutoRow>;
}

export async function atualizarProdutoCatalogo(
  produtoId: string,
  dados: {
    nome: string;
    descricao?: string;
    categoria?: string;
    codigoBarras?: string | null;
    marca?: string | null;
    unidadeMedida?: string;
  },
  existente: ProdutoRow
): Promise<void> {
  const chaves = computeCamposChaveProduto({
    nome: dados.nome || existente.nome,
    codigoBarras: dados.codigoBarras ?? existente.codigoBarras,
    marca: dados.marca ?? existente.marca,
    categoria: dados.categoria ?? existente.categoria,
  });
  const sku = computeSkuNacionalFields({
    nome: dados.nome || existente.nome,
    codigoBarras: dados.codigoBarras ?? existente.codigoBarras,
    marca: dados.marca ?? existente.marca,
    categoria: dados.categoria ?? existente.categoria,
    chaveInsight: chaves.chaveInsight,
  });

  await prisma.produtos.update({
    where: { id: produtoId },
    data: {
      descricao: dados.descricao || existente.descricao,
      categoria: dados.categoria || existente.categoria,
      marca: dados.marca || existente.marca,
      unidadeMedida: dados.unidadeMedida || existente.unidadeMedida,
      nomeChave: chaves.nomeChave,
      chaveInsight: chaves.chaveInsight,
      skuNacional: sku.skuNacional,
      embeddingJson: sku.embeddingJson,
      ativo: true,
      dataAtualizacao: new Date(),
    },
  });
}
