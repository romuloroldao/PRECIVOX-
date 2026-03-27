/**
 * Filtros de catálogo alinhados a GET /api/produtos/buscar — reutilizado para contagens por mercado e analytics.
 */

export type BuscaQueryParams = {
  busca: string | null;
  categoria: string | null;
  marca: string | null;
  precoMin: string | null;
  precoMax: string | null;
  disponivel: string | null;
  emPromocao: string | null;
  mercado: string | null;
  cidade: string | null;
};

export function buildEstoqueFilter(params: BuscaQueryParams): Record<string, unknown> {
  const f: Record<string, unknown> = {};

  if (params.disponivel === 'true') {
    f.disponivel = true;
    f.quantidade = { gt: 0 };
  }

  if (params.emPromocao === 'true') {
    f.emPromocao = true;
  }

  if (params.precoMin || params.precoMax) {
    const preco: Record<string, number> = {};
    if (params.precoMin) preco.gte = parseFloat(params.precoMin);
    if (params.precoMax) preco.lte = parseFloat(params.precoMax);
    f.preco = preco;
  }

  const unidadeWhere: Record<string, string> = {};
  if (params.mercado) unidadeWhere.mercadoId = params.mercado;
  if (params.cidade) unidadeWhere.cidade = params.cidade;

  if (Object.keys(unidadeWhere).length > 0) {
    f.unidades = unidadeWhere;
  }

  return f;
}

export function buildProdutoWhereFromBuscaParams(params: BuscaQueryParams): {
  whereProduct: Record<string, unknown>;
  estoqueFilter: Record<string, unknown>;
  hasEstoqueWhere: boolean;
} {
  const estoqueFilter = buildEstoqueFilter(params);
  const { busca, categoria, marca } = params;

  const whereProduct: Record<string, unknown> = { ativo: true };
  const andClauses: Record<string, unknown>[] = [];

  if (busca) {
    andClauses.push({
      OR: [
        { nome: { contains: busca, mode: 'insensitive' } },
        { marca: { contains: busca, mode: 'insensitive' } },
        { codigoBarras: { contains: busca, mode: 'insensitive' } },
      ],
    });
  }

  if (categoria) {
    andClauses.push({ categoria });
  }

  if (marca && !busca) {
    andClauses.push({
      marca: { contains: marca, mode: 'insensitive' },
    });
  }

  andClauses.push({
    estoques: {
      some: estoqueFilter,
    },
  });

  if (andClauses.length > 0) {
    whereProduct.AND = andClauses;
  }

  return {
    whereProduct,
    estoqueFilter,
    hasEstoqueWhere: Object.keys(estoqueFilter).length > 0,
  };
}

/**
 * Mesma busca, mas apenas ofertas cuja unidade pertence ao mercado informado.
 */
export function whereProdutoComMercado(
  whereProduct: Record<string, unknown>,
  _estoqueFilter: Record<string, unknown>,
  mercadoId: string
): Record<string, unknown> {
  const and = (whereProduct.AND as Record<string, unknown>[]) || [];
  const novoAnd = and.map((clause) => {
    if (clause.estoques && typeof clause.estoques === 'object' && 'some' in clause.estoques) {
      const some = (clause.estoques as { some: Record<string, unknown> }).some;
      const prevU =
        some.unidades && typeof some.unidades === 'object' && !Array.isArray(some.unidades)
          ? { ...(some.unidades as Record<string, unknown>) }
          : {};
      return {
        estoques: {
          some: {
            ...some,
            unidades: { ...prevU, mercadoId },
          },
        },
      };
    }
    return clause;
  });
  return { ...whereProduct, AND: novoAnd };
}

export function buscaParamsFromSearchParams(searchParams: URLSearchParams): BuscaQueryParams {
  return {
    busca: searchParams.get('busca'),
    categoria: searchParams.get('categoria'),
    marca: searchParams.get('marca'),
    precoMin: searchParams.get('precoMin'),
    precoMax: searchParams.get('precoMax'),
    disponivel: searchParams.get('disponivel'),
    emPromocao: searchParams.get('emPromocao'),
    mercado: searchParams.get('mercado'),
    cidade: searchParams.get('cidade'),
  };
}
