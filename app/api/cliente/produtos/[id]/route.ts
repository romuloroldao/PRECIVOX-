import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatarOfertaComparativa } from '@/lib/produtos-busca-comparativo';

export const dynamic = 'force-dynamic';

const estoqueInclude = {
  produtos: true,
  unidades: { include: { mercados: true } },
} as const;

async function loadOfertaByEstoqueId(id: string) {
  const estoque = await prisma.estoques.findUnique({
    where: { id },
    include: estoqueInclude,
  });

  if (
    !estoque?.produtos?.ativo ||
    !estoque.unidades?.ativa ||
    !estoque.unidades.mercados?.ativo
  ) {
    return null;
  }

  return formatarOfertaComparativa(estoque);
}

async function loadMelhorOfertaPorProduto(produtoId: string) {
  const estoque = await prisma.estoques.findFirst({
    where: {
      produtoId,
      disponivel: true,
      quantidade: { gt: 0 },
      unidades: { ativa: true, mercados: { ativo: true } },
      produtos: { ativo: true },
    },
    orderBy: [{ emPromocao: 'desc' }, { preco: 'asc' }],
    include: estoqueInclude,
  });

  if (!estoque) return null;
  return formatarOfertaComparativa(estoque);
}

function calcularEconomia(
  oferta: ReturnType<typeof formatarOfertaComparativa>,
  precos: number[]
) {
  if (!precos.length) return { savings: 0, isBestPrice: true };
  const avgPrice = precos.reduce((a, b) => a + b, 0) / precos.length;
  const minPrice = Math.min(...precos);
  const savings = Math.max(0, avgPrice - oferta.precoEfetivo);
  const isBestPrice = oferta.precoEfetivo <= minPrice + 0.001;
  return {
    savings: savings > 0.01 ? Math.round(savings * 100) / 100 : 0,
    isBestPrice,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    let oferta = await loadOfertaByEstoqueId(id);
    let produtoId: string | undefined = oferta?.produto?.id as string | undefined;

    if (!oferta) {
      const produto = await prisma.produtos.findFirst({
        where: { id, ativo: true },
        select: { id: true, descricao: true },
      });

      if (!produto) {
        return NextResponse.json(
          { success: false, error: 'Produto não encontrado' },
          { status: 404 }
        );
      }

      produtoId = produto.id;
      oferta = await loadMelhorOfertaPorProduto(produto.id);

      if (!oferta) {
        return NextResponse.json(
          { success: false, error: 'Produto sem ofertas disponíveis' },
          { status: 404 }
        );
      }
    }

    const [todasOfertas, produtoDetalhe] = await Promise.all([
      prisma.estoques.findMany({
        where: {
          produtoId: produtoId!,
          disponivel: true,
          unidades: { ativa: true, mercados: { ativo: true } },
        },
        select: { preco: true, precoPromocional: true, emPromocao: true },
      }),
      prisma.produtos.findUnique({
        where: { id: produtoId },
        select: { descricao: true, unidadeMedida: true },
      }),
    ]);

    const precos = todasOfertas.map((e) =>
      e.emPromocao && e.precoPromocional
        ? Number(e.precoPromocional)
        : Number(e.preco)
    );
    const { savings, isBestPrice } = calcularEconomia(oferta, precos);

    const imagem =
      oferta.imagemThumb || oferta.imagem || '/logo-precivox.svg';

    return NextResponse.json({
      success: true,
      data: {
        id: oferta.id,
        produtoCatalogoId: produtoId,
        estoqueId: oferta.id,
        name: oferta.nome,
        price: oferta.precoEfetivo,
        category: oferta.categoria ?? 'Geral',
        image: imagem,
        store: oferta.unidade.mercado.nome,
        savings,
        description: produtoDetalhe?.descricao ?? undefined,
        available: oferta.disponivel && oferta.quantidade > 0,
        brand: oferta.marca ?? undefined,
        weight: produtoDetalhe?.unidadeMedida ?? undefined,
        stock: oferta.quantidade,
        isBestPrice,
        emPromocao: oferta.emPromocao,
        unidade: oferta.unidade,
      },
    });
  } catch (error) {
    console.error('[API cliente/produtos]', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar produto' },
      { status: 500 }
    );
  }
}
