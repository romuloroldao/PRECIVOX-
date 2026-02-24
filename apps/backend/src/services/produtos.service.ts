import { prisma } from '@shared/prisma';
import { Prisma } from '@prisma/client';
import { imageAIService } from './image-ai.service';
import crypto from 'crypto';

interface CreateProductDTO {
    nome: string;
    categoria?: string;
    subcategoria?: string;
    preco: number;
    mercadoId?: string;
    marca?: string;
    codigoBarras?: string;
    peso?: string;
    descricao?: string;
    estoque?: number;
    promocao?: boolean;
    desconto?: number;
    unidadeId?: string; // Optional: if not provided, try to find one
}

interface UpdateProductDTO {
    nome?: string;
    categoria?: string;
    subcategoria?: string;
    preco?: number;
    marca?: string;
    codigoBarras?: string;
    peso?: string;
    descricao?: string;
    estoque?: number;
    quantidade?: number;
    promocao?: boolean;
    desconto?: number;
    ativo?: boolean;
    estoqueId?: string;
    precoPromocional?: number | null;
    disponivel?: boolean;
}

interface ProductFilterDTO {
    busca?: string;
    categoria?: string;
    mercado?: string; // Slug or ID
    search?: string; // Alias for busca
    page?: number;
    limit?: number;
    preco_min?: number;
    preco_max?: number;
    promocao?: boolean;
    unidadeId?: string;
}

export class ProdutosService {

    /**
     * List products with advanced filtering matching legacy behavior
     */
    async findAll(filters: ProductFilterDTO) {
        const {
            busca, search, categoria, mercado,
            page = 1, limit = 50,
            preco_min, preco_max, promocao, unidadeId
        } = filters;

        const searchTerm = busca || search;
        const parsedPage = Number(page) > 0 ? Number(page) : 1;
        const parsedLimit = Number(limit) > 0 ? Number(limit) : 50;
        const skip = (parsedPage - 1) * parsedLimit;

        const where: Prisma.estoquesWhereInput = {
            disponivel: true,
            unidades: {
                mercados: {
                    ativo: true
                },
                ativa: true
            }
        };

        // Filtro por mercado
        if (mercado) {
            where.unidades = {
                ...where.unidades,
                mercados: {
                    OR: [
                        { id: mercado },
                        { nome: { contains: mercado, mode: 'insensitive' } }, // Slug approximation
                        // Note: Schema doesn't have slug explicitly on 'mercados', using nome or assumed slug logic if it existed
                    ]
                }
            } as any;
        }

        if (unidadeId) {
            where.unidadeId = String(unidadeId);
        }

        // Filtro por preço
        if (preco_min || preco_max) {
            where.preco = {};
            if (preco_min) where.preco.gte = preco_min;
            if (preco_max) where.preco.lte = preco_max;
        }

        // Filtro por promoção
        if (promocao) {
            where.emPromocao = true;
        }

        // Filtros de produto (nested)
        const productWhere: Prisma.produtosWhereInput = { ativo: true };

        if (categoria) {
            productWhere.categoria = categoria;
        }

        if (searchTerm) {
            productWhere.OR = [
                { nome: { contains: searchTerm, mode: 'insensitive' } },
                { marca: { contains: searchTerm, mode: 'insensitive' } },
                { codigoBarras: { contains: searchTerm } }
            ];
        }

        where.produtos = productWhere;

        const [total, items] = await Promise.all([
            prisma.estoques.count({ where }),
            prisma.estoques.findMany({
                where,
                include: {
                    produtos: true,
                    unidades: {
                        include: { mercados: true }
                    }
                },
                skip,
                take: parsedLimit,
                orderBy: [
                    { emPromocao: 'desc' },
                    { preco: 'asc' }
                ]
            })
        ]);

        // Map to legacy structure for compatibility if needed, or return modern structure
        // Returning modern structure but enriching it
        return {
            data: items.map(item => ({
                ...item.produtos,
                // Merge stock info into product info to mimic legacy 'flattened' view
                preco: Number(item.preco),
                precoMedio: Number(item.preco).toFixed(2),
                preco_promocional: item.precoPromocional ? Number(item.precoPromocional) : null,
                promocao: item.emPromocao,
                emPromocao: item.emPromocao,
                estoque: item.quantidade,
                quantidadeTotal: item.quantidade,
                mercado_nome: item.unidades.mercados.nome,
                mercado_id: item.unidades.mercados.id,
                unidade_nome: item.unidades.nome,
                unidade_id: item.unidades.id
            })),
            pagination: {
                page: parsedPage,
                limit: parsedLimit,
                total,
                pages: Math.ceil(total / parsedLimit)
            }
        };
    }

    /**
     * Create a new product (Catalog + Stock)
     */
    async create(data: CreateProductDTO) {
        if (!data.nome || !data.nome.trim()) {
            throw new Error('Nome do produto é obrigatório');
        }
        if (data.preco === undefined || data.preco === null || Number.isNaN(Number(data.preco))) {
            throw new Error('Preço do produto é obrigatório');
        }
        if (!data.mercadoId && !data.unidadeId) {
            throw new Error('Informe mercadoId ou unidadeId para criar o produto');
        }

        // 1. Find the target Unit
        let unidadeId = data.unidadeId;
        if (!unidadeId) {
            // Try to find the first active unit for this market
            const unidade = await prisma.unidades.findFirst({
                where: { mercadoId: data.mercadoId, ativa: true }
            });
            if (!unidade) {
                throw new Error('Nenhuma unidade ativa encontrada para este mercado');
            }
            unidadeId = unidade.id;
        }

        // 2. Generate Image via AI
        let imagemUrl = null;
        try {
            if (data.nome && data.categoria) {
                const imageResult = await imageAIService.generateProductImage(
                    data.nome,
                    data.categoria,
                    data.marca
                );
                imagemUrl = imageResult.url;
            }
        } catch (e) {
            console.warn('Falha ao gerar imagem IA:', e);
        }

        return await prisma.$transaction(async (tx) => {
            // 3. Create Product Catalog Item
            const produto = await tx.produtos.create({
                data: {
                    id: crypto.randomUUID(), // Manual UUID gen
                    nome: data.nome,
                    categoria: data.categoria,
                    marca: data.marca,
                    codigoBarras: data.codigoBarras,
                    descricao: data.descricao,
                    imagem: imagemUrl,
                    dataAtualizacao: new Date()
                }
            });

            // 4. Create Stock Entry
            const estoque = await tx.estoques.create({
                data: {
                    id: crypto.randomUUID(),
                    produtoId: produto.id,
                    unidadeId: unidadeId!,
                    preco: data.preco,
                    quantidade: data.estoque || 0,
                    emPromocao: data.promocao || false,
                    precoPromocional: data.desconto
                        ? data.preco * (1 - (data.desconto / 100))
                        : null,
                    atualizadoEm: new Date()
                },
                include: {
                    produtos: true
                }
            });

            return { ...produto, ...estoque };
        });
    }

    async findById(id: string) {
        // ID can be product ID or stock ID? Legacy used product ID. 
        // In modern, Product ID is the catalog ID.
        const product = await prisma.produtos.findUnique({
            where: { id },
            include: {
                estoques: {
                    include: {
                        unidades: { include: { mercados: true } }
                    }
                }
            }
        });

        if (!product) return null;
        return product;
    }

    async update(id: string, data: UpdateProductDTO, userId?: string) {
        // We assume ID is the Product ID (catalog).
        // Updating catalog updates for ALL units? 
        // Legacy behavior implies updating "The Product" which was bound to a market.
        // Here, product is independent of Unit.
        // If we update price, we must update `estoques`.

        // For simplicity and legacy compatibility, we will:
        // 1. Update Product Catalog details
        // 2. Update Stock details for ALL stocks of this product (risky?) or just one?
        // Given the legacy model was 1:1, here it might be 1:N.
        // We will update ALL stocks for this product as a simplification for "Product Management".

        return await prisma.$transaction(async (tx) => {
            const normalizedEstoque = data.estoque !== undefined ? data.estoque : data.quantidade;
            const productUpdate: Prisma.produtosUpdateInput = {
                dataAtualizacao: new Date()
            };
            if (data.nome !== undefined) productUpdate.nome = data.nome;
            if (data.categoria !== undefined) productUpdate.categoria = data.categoria;
            if (data.marca !== undefined) productUpdate.marca = data.marca;
            if (data.codigoBarras !== undefined) productUpdate.codigoBarras = data.codigoBarras;
            if (data.descricao !== undefined) productUpdate.descricao = data.descricao;
            if (data.ativo !== undefined) productUpdate.ativo = data.ativo;

            const updatedProduct = await tx.produtos.update({
                where: { id },
                data: productUpdate
            });

            // Update stocks
            if (
                data.preco !== undefined ||
                normalizedEstoque !== undefined ||
                data.promocao !== undefined ||
                data.precoPromocional !== undefined ||
                data.disponivel !== undefined
            ) {
                const stockUpdate: Prisma.estoquesUpdateManyMutationInput = {
                    atualizadoEm: new Date()
                };
                if (data.preco !== undefined) stockUpdate.preco = data.preco;
                if (normalizedEstoque !== undefined) stockUpdate.quantidade = normalizedEstoque;
                if (data.promocao !== undefined) stockUpdate.emPromocao = data.promocao;
                if (data.precoPromocional !== undefined) stockUpdate.precoPromocional = data.precoPromocional;
                if (data.disponivel !== undefined) stockUpdate.disponivel = data.disponivel;

                if (data.estoqueId) {
                    await tx.estoques.updateMany({
                        where: { id: data.estoqueId, produtoId: id },
                        data: stockUpdate
                    });
                } else {
                    await tx.estoques.updateMany({
                        where: { produtoId: id },
                        data: stockUpdate
                    });
                }
            }

            return updatedProduct;
        });
    }

    async delete(id: string) {
        // Soft delete
        return await prisma.produtos.update({
            where: { id },
            data: {
                ativo: false,
                dataAtualizacao: new Date()
            }
        });
    }

    async regenerateImage(id: string) {
        const product = await prisma.produtos.findUnique({ where: { id } });
        if (!product) throw new Error('Product not found');

        const imageResult = await imageAIService.generateProductImage(
            product.nome,
            product.categoria || 'geral',
            product.marca || ''
        );

        return await prisma.produtos.update({
            where: { id },
            data: {
                imagem: imageResult.url,
                dataAtualizacao: new Date()
            }
        });
    }
}

export const produtosService = new ProdutosService();
