/**
 * Busca comparativa — uma linha por oferta (estoque × unidade × mercado).
 */

import type { Prisma } from '@prisma/client';
import type { BuscaQueryParams } from '@/lib/produtos-busca-where';

export function buildEstoqueWhereComparativo(params: BuscaQueryParams): Prisma.estoquesWhereInput {
  const where: Prisma.estoquesWhereInput = {};

  if (params.disponivel === 'true') {
    where.disponivel = true;
    where.quantidade = { gt: 0 };
  }

  if (params.emPromocao === 'true') {
    where.emPromocao = true;
  }

  if (params.precoMin || params.precoMax) {
    const preco: Prisma.DecimalFilter = {};
    if (params.precoMin) preco.gte = parseFloat(params.precoMin);
    if (params.precoMax) preco.lte = parseFloat(params.precoMax);
    where.preco = preco;
  }

  const unidadeWhere: Prisma.unidadesWhereInput = {
    ativa: true,
    mercados: { ativo: true },
  };
  if (params.mercado) unidadeWhere.mercadoId = params.mercado;
  if (params.cidade) unidadeWhere.cidade = params.cidade;
  where.unidades = unidadeWhere;

  const produtoClauses: Prisma.produtosWhereInput[] = [{ ativo: true }];

  if (params.busca) {
    produtoClauses.push({
      OR: [
        { nome: { contains: params.busca, mode: 'insensitive' } },
        { marca: { contains: params.busca, mode: 'insensitive' } },
        { codigoBarras: { contains: params.busca, mode: 'insensitive' } },
      ],
    });
  }

  if (params.categoria) {
    produtoClauses.push({ categoria: params.categoria });
  }

  if (params.marca && !params.busca) {
    produtoClauses.push({
      marca: { contains: params.marca, mode: 'insensitive' },
    });
  }

  where.produtos = produtoClauses.length === 1 ? produtoClauses[0] : { AND: produtoClauses };

  return where;
}

export type OfertaFormatada = {
  id: string;
  nome: string;
  preco: number;
  precoPromocional: number | null;
  precoEfetivo: number;
  emPromocao: boolean;
  disponivel: boolean;
  quantidade: number;
  categoria: string | null;
  marca: string | null;
  imagem: string | null;
  imagemThumb: string | null;
  imagemStatus: string | null;
  truth: {
    fonte: string;
    confianca: number;
    verificadoEm: string | null;
    atualizadoEm: string;
  } | null;
  unidade: {
    id: string;
    nome: string;
    endereco: string;
    cidade: string;
    estado: string;
    latitude: number | null;
    longitude: number | null;
    mercado: { id: string; nome: string };
  };
  produto: { id: string; nome: string | null; [key: string]: unknown };
};

export function formatarOfertaComparativa(
  estoque: {
    id: string;
    preco: { toNumber: () => number };
    precoPromocional: { toNumber: () => number } | null;
    emPromocao: boolean;
    quantidade: number | null;
    disponivel: boolean;
    fonte: string | null;
    confianca: number | null;
    verificadoEm: Date | null;
    atualizadoEm: Date;
    produtos: {
      id: string;
      nome: string | null;
      categoria: string | null;
      marca: string | null;
      imagem: string | null;
  imagemThumb: string | null;
  imagemStatus: string | null;
      [key: string]: unknown;
    };
    unidades: {
      id: string;
      nome: string;
      endereco: string | null;
      cidade: string | null;
      estado: string | null;
      latitude: number | null;
      longitude: number | null;
      mercados: { id: string; nome: string };
    };
  }
): OfertaFormatada {
  const produto = estoque.produtos;
  const unidade = estoque.unidades;
  const precoEfetivo =
    estoque.emPromocao && estoque.precoPromocional
      ? estoque.precoPromocional.toNumber()
      : estoque.preco.toNumber();

  return {
    id: estoque.id,
    nome: produto.nome ?? 'Produto',
    preco: estoque.preco.toNumber(),
    precoPromocional: estoque.precoPromocional?.toNumber() ?? null,
    precoEfetivo,
    emPromocao: estoque.emPromocao,
    disponivel: (estoque.quantidade ?? 0) > 0 && estoque.disponivel,
    quantidade: estoque.quantidade ?? 0,
    categoria: produto.categoria,
    marca: produto.marca,
    imagem: produto.imagem,
    imagemThumb: (produto as { imagemThumb?: string | null }).imagemThumb ?? null,
    imagemStatus: (produto as { imagemStatus?: string | null }).imagemStatus ?? null,
    truth: {
      fonte: estoque.fonte ?? 'UPLOAD_GESTOR',
      confianca: estoque.confianca ?? 70,
      verificadoEm: estoque.verificadoEm?.toISOString() ?? null,
      atualizadoEm: estoque.atualizadoEm.toISOString(),
    },
    unidade: {
      id: unidade.id,
      nome: unidade.nome,
      endereco: unidade.endereco ?? '',
      cidade: unidade.cidade ?? '',
      estado: unidade.estado ?? '',
      latitude: unidade.latitude,
      longitude: unidade.longitude,
      mercado: {
        id: unidade.mercados.id,
        nome: unidade.mercados.nome,
      },
    },
    produto: produto as OfertaFormatada['produto'],
  };
}
