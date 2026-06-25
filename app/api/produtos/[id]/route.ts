import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeCamposChaveProduto } from '@/lib/produtos-chaves';
import { requireApiSession, isAuthResponse } from '@/lib/api-auth';
import { z } from 'zod';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const updateProdutoSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().optional().nullable(),
  categoria: z.string().optional().nullable(),
  codigoBarras: z.string().optional().nullable(),
  marca: z.string().optional().nullable(),
  unidadeMedida: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
  // Campos de estoque (para atualizar estoque de uma unidade específica)
  estoqueId: z.string().optional(),
  preco: z.number().optional(),
  precoPromocional: z.number().optional().nullable(),
  quantidade: z.number().optional(),
  emPromocao: z.boolean().optional(),
  disponivel: z.boolean().optional(),
});

// GET - Buscar produto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireApiSession(request, { roles: ['ADMIN', 'GESTOR'] });
    if (isAuthResponse(auth)) return auth;

    const userRole = auth.role;
    const userId = auth.id;

    const produto = await prisma.produtos.findUnique({
      where: { id: params.id },
      include: {
        estoques: {
          include: {
            unidades: {
              include: {
                mercados: {
                  select: {
                    id: true,
                    nome: true,
                    gestorId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!produto) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Se for GESTOR, verificar se o produto pertence ao seu mercado
    if (userRole === 'GESTOR') {
      const temAcesso = produto.estoques.some(
        (estoque) => estoque.unidades?.mercados?.gestorId === userId
      );

      if (!temAcesso) {
        return NextResponse.json(
          { success: false, error: 'Acesso negado' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: produto,
    });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar produto' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar produto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireApiSession(request, { roles: ['ADMIN', 'GESTOR'] });
    if (isAuthResponse(auth)) return auth;

    const userRole = auth.role;
    const userId = auth.id;

    // Verificar se produto existe
    const produtoExistente = await prisma.produtos.findUnique({
      where: { id: params.id },
      include: {
        estoques: {
          include: {
            unidades: {
              include: {
                mercados: {
                  select: {
                    gestorId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!produtoExistente) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Se for GESTOR, verificar se o produto pertence ao seu mercado
    if (userRole === 'GESTOR') {
      const temAcesso = produtoExistente.estoques.some(
        (estoque) => estoque.unidades?.mercados?.gestorId === userId
      );

      if (!temAcesso) {
        return NextResponse.json(
          { success: false, error: 'Acesso negado' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const validatedData = updateProdutoSchema.parse(body);

    const mergedChaves = computeCamposChaveProduto({
      nome: validatedData.nome ?? produtoExistente.nome,
      codigoBarras:
        validatedData.codigoBarras !== undefined
          ? validatedData.codigoBarras
          : produtoExistente.codigoBarras,
      marca: validatedData.marca !== undefined ? validatedData.marca : produtoExistente.marca,
      categoria:
        validatedData.categoria !== undefined ? validatedData.categoria : produtoExistente.categoria,
    });

    // Atualizar produto
    const produtoAtualizado = await prisma.produtos.update({
      where: { id: params.id },
      data: {
        ...(validatedData.nome && { nome: validatedData.nome }),
        ...(validatedData.descricao !== undefined && { descricao: validatedData.descricao }),
        ...(validatedData.categoria !== undefined && { categoria: validatedData.categoria }),
        ...(validatedData.codigoBarras !== undefined && { codigoBarras: validatedData.codigoBarras }),
        ...(validatedData.marca !== undefined && { marca: validatedData.marca }),
        ...(validatedData.unidadeMedida !== undefined && { unidadeMedida: validatedData.unidadeMedida }),
        ...(validatedData.ativo !== undefined && { ativo: validatedData.ativo }),
        nomeChave: mergedChaves.nomeChave,
        chaveInsight: mergedChaves.chaveInsight,
        skuNacional: mergedChaves.skuNacional,
        embeddingJson: mergedChaves.embeddingJson,
        dataAtualizacao: new Date(),
      },
      include: {
        estoques: {
          include: {
            unidades: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    });

    // Se foi fornecido estoqueId, atualizar estoque específico
    if (validatedData.estoqueId) {
      const estoqueData: any = {};
      
      if (validatedData.preco !== undefined) {
        estoqueData.preco = validatedData.preco;
      }
      if (validatedData.precoPromocional !== undefined) {
        estoqueData.precoPromocional = validatedData.precoPromocional;
      }
      if (validatedData.quantidade !== undefined) {
        estoqueData.quantidade = validatedData.quantidade;
      }
      if (validatedData.emPromocao !== undefined) {
        estoqueData.emPromocao = validatedData.emPromocao;
      }
      if (validatedData.disponivel !== undefined) {
        estoqueData.disponivel = validatedData.disponivel;
      }

      if (Object.keys(estoqueData).length > 0) {
        estoqueData.atualizadoEm = new Date();

        const estoqueAntes = await prisma.estoques.findUnique({
          where: { id: validatedData.estoqueId },
          include: {
            produtos: { select: { nome: true, codigoBarras: true } },
            unidades: { select: { mercadoId: true } },
          },
        });

        await prisma.estoques.update({
          where: { id: validatedData.estoqueId },
          data: estoqueData,
        });

        if (
          estoqueAntes?.unidades?.mercadoId &&
          (validatedData.preco !== undefined ||
            validatedData.precoPromocional !== undefined ||
            validatedData.emPromocao !== undefined)
        ) {
          const { notificarWebhookPrecoAlterado } = await import('@/lib/parceiro-webhook-preco');
          notificarWebhookPrecoAlterado(
            estoqueAntes.unidades.mercadoId,
            [
              {
                estoqueId: estoqueAntes.id,
                produtoId: estoqueAntes.produtoId,
                unidadeId: estoqueAntes.unidadeId,
                codigoBarras: estoqueAntes.produtos.codigoBarras,
                produtoNome: estoqueAntes.produtos.nome,
                preco: validatedData.preco ?? Number(estoqueAntes.preco),
                precoPromocional:
                  validatedData.precoPromocional ??
                  (estoqueAntes.precoPromocional ? Number(estoqueAntes.precoPromocional) : null),
                emPromocao: validatedData.emPromocao ?? estoqueAntes.emPromocao,
                quantidade: validatedData.quantidade ?? estoqueAntes.quantidade,
                precoAnterior: Number(estoqueAntes.preco),
              },
            ],
            'gestor_produto'
          );
        }
      }
    }

    // Recarregar produto atualizado
    const produtoFinal = await prisma.produtos.findUnique({
      where: { id: params.id },
      include: {
        estoques: {
          include: {
            unidades: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Produto atualizado com sucesso',
      data: produtoFinal,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar produto' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir produto (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireApiSession(request, { roles: ['ADMIN', 'GESTOR'] });
    if (isAuthResponse(auth)) return auth;

    const userRole = auth.role;
    const userId = auth.id;

    // ADMIN e GESTOR podem excluir (com permissões)

    // Verificar se produto existe
    const produto = await prisma.produtos.findUnique({
      where: { id: params.id },
      include: {
        estoques: {
          include: {
            unidades: {
              include: {
                mercados: {
                  select: {
                    gestorId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!produto) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Se for GESTOR, verificar se o produto pertence ao seu mercado
    if (userRole === 'GESTOR') {
      const temAcesso = produto.estoques.some(
        (estoque) => estoque.unidades?.mercados?.gestorId === userId
      );

      if (!temAcesso) {
        return NextResponse.json(
          { success: false, error: 'Acesso negado' },
          { status: 403 }
        );
      }
    }

    // Soft delete - marcar como inativo
    await prisma.produtos.update({
      where: { id: params.id },
      data: {
        ativo: false,
        dataAtualizacao: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Produto excluído com sucesso',
    });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir produto' },
      { status: 500 }
    );
  }
}

