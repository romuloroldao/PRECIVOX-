import type { ImagemStatus, produto_imagens, produtos } from '@prisma/client';
import { prisma } from '@/lib/prisma-node';
import { MAX_IMAGE_ATTEMPTS } from './config';
import { processAndStoreFromBuffer, processAndStoreFromUrl } from './image-processor';
import { resolverImagemOff } from './off-client';
import type { EffectiveImage, ProdutoImagemMeta, AdminProdutoImagemItem } from './types';

type ProdutoComImagem = produtos & { produtoImagem: produto_imagens | null };

function computeEffective(record: produto_imagens | null): EffectiveImage {
  if (!record) {
    return { url: null, thumbUrl: null, status: 'PENDENTE' };
  }

  if (record.status === 'MANUAL' && record.manualUrl) {
    return {
      url: record.manualUrl,
      thumbUrl: record.manualThumbUrl ?? record.manualUrl,
      status: 'MANUAL',
    };
  }

  if (record.status === 'AUTOMATICA' && record.autoUrl) {
    return {
      url: record.autoUrl,
      thumbUrl: record.autoThumbUrl ?? record.autoUrl,
      status: 'AUTOMATICA',
    };
  }

  if (record.status === 'INVALIDA') {
    return { url: null, thumbUrl: null, status: 'INVALIDA' };
  }

  return { url: null, thumbUrl: null, status: record.status };
}

async function denormalizeProduto(
  produtoId: string,
  effective: EffectiveImage
): Promise<void> {
  await prisma.produtos.update({
    where: { id: produtoId },
    data: {
      imagem: effective.url,
      imagemThumb: effective.thumbUrl,
      imagemStatus: effective.status,
      dataAtualizacao: new Date(),
    },
  });
}

async function ensureProdutoImagemRecord(produtoId: string): Promise<produto_imagens> {
  const existing = await prisma.produto_imagens.findUnique({
    where: { produtoId },
  });
  if (existing) return existing;

  return prisma.produto_imagens.create({
    data: { produtoId, status: 'PENDENTE' },
  });
}

export async function marcarPendente(produtoId: string): Promise<void> {
  const record = await prisma.produto_imagens.findUnique({ where: { produtoId } });
  if (record && record.status !== 'PENDENTE') return;

  await ensureProdutoImagemRecord(produtoId);
  await prisma.produtos.update({
    where: { id: produtoId },
    data: { imagemStatus: 'PENDENTE', dataAtualizacao: new Date() },
  });
}

export async function marcarPendentesEmLote(produtoIds: string[]): Promise<void> {
  if (!produtoIds.length) return;

  const existing = await prisma.produto_imagens.findMany({
    where: { produtoId: { in: produtoIds } },
    select: { produtoId: true, status: true },
  });
  const existingMap = new Map(existing.map((e) => [e.produtoId, e.status]));

  const toCreate = produtoIds.filter((id) => !existingMap.has(id));
  if (toCreate.length) {
    await prisma.produto_imagens.createMany({
      data: toCreate.map((produtoId) => ({ produtoId, status: 'PENDENTE' })),
      skipDuplicates: true,
    });
  }

  const toUpdate = produtoIds.filter(
    (id) => !existingMap.has(id) || existingMap.get(id) === 'PENDENTE'
  );
  if (toUpdate.length) {
    await prisma.produtos.updateMany({
      where: { id: { in: toUpdate } },
      data: { imagemStatus: 'PENDENTE' },
    });
  }
}

export async function processarImagemAutomatica(
  produto: Pick<produtos, 'id' | 'nome' | 'codigoBarras' | 'marca'>
): Promise<ImagemStatus> {
  const record = await ensureProdutoImagemRecord(produto.id);

  if (record.status === 'MANUAL') {
    return 'MANUAL';
  }

  if (record.status === 'AUTOMATICA' && record.autoUrl) {
    return 'AUTOMATICA';
  }

  if (record.status === 'INVALIDA' && record.tentativas >= MAX_IMAGE_ATTEMPTS) {
    return 'INVALIDA';
  }

  try {
    const offResult = await resolverImagemOff(
      produto.nome,
      produto.codigoBarras,
      produto.marca
    );

    if (!offResult) {
      const tentativas = record.tentativas + 1;
      const status: ImagemStatus =
        tentativas >= MAX_IMAGE_ATTEMPTS ? 'INVALIDA' : 'PENDENTE';

      const updated = await prisma.produto_imagens.update({
        where: { produtoId: produto.id },
        data: {
          status,
          tentativas,
          ultimoErro: 'Nenhuma imagem encontrada no Open Food Facts',
        },
      });

      const effective = computeEffective(updated);
      await denormalizeProduto(produto.id, effective);
      return status;
    }

    const processed = await processAndStoreFromUrl(offResult.imageUrl);

    const updated = await prisma.produto_imagens.update({
      where: { produtoId: produto.id },
      data: {
        status: 'AUTOMATICA',
        autoUrl: processed.fullUrl,
        autoThumbUrl: processed.thumbUrl,
        autoHash: processed.fullHash,
        autoOrigem: 'open_food_facts',
        autoFonteUrl: offResult.sourceUrl,
        autoEan: offResult.ean ?? produto.codigoBarras?.replace(/\D/g, '') ?? null,
        ultimoErro: null,
      },
    });

    const effective = computeEffective(updated);
    await denormalizeProduto(produto.id, effective);
    return 'AUTOMATICA';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    const tentativas = record.tentativas + 1;
    const status: ImagemStatus =
      tentativas >= MAX_IMAGE_ATTEMPTS ? 'INVALIDA' : 'PENDENTE';

    const updated = await prisma.produto_imagens.update({
      where: { produtoId: produto.id },
      data: { status, tentativas, ultimoErro: message },
    });

    const effective = computeEffective(updated);
    await denormalizeProduto(produto.id, effective);
    return status;
  }
}

export async function processarImagemManual(
  produtoId: string,
  buffer: Buffer,
  origem = 'upload_admin'
): Promise<ProdutoImagemMeta> {
  const processed = await processAndStoreFromBuffer(buffer);
  await ensureProdutoImagemRecord(produtoId);

  const updated = await prisma.produto_imagens.update({
    where: { produtoId },
    data: {
      status: 'MANUAL',
      manualUrl: processed.fullUrl,
      manualThumbUrl: processed.thumbUrl,
      manualHash: processed.fullHash,
      manualOrigem: origem,
      ultimoErro: null,
    },
  });

  const effective = computeEffective(updated);
  await denormalizeProduto(produtoId, effective);
  return toMeta(updated, effective);
}

export async function restaurarAutomatica(produtoId: string): Promise<ProdutoImagemMeta> {
  const record = await prisma.produto_imagens.findUnique({ where: { produtoId } });
  if (!record) {
    throw new Error('Registro de imagem não encontrado');
  }

  if (record.autoUrl) {
    const updated = await prisma.produto_imagens.update({
      where: { produtoId },
      data: { status: 'AUTOMATICA', manualUrl: null, manualThumbUrl: null, manualHash: null, manualOrigem: null },
    });
    const effective = computeEffective(updated);
    await denormalizeProduto(produtoId, effective);
    return toMeta(updated, effective);
  }

  await prisma.produto_imagens.update({
    where: { produtoId },
    data: {
      status: 'PENDENTE',
      manualUrl: null,
      manualThumbUrl: null,
      manualHash: null,
      manualOrigem: null,
      tentativas: 0,
      ultimoErro: null,
    },
  });

  const produto = await prisma.produtos.findUniqueOrThrow({ where: { id: produtoId } });
  const status = await processarImagemAutomatica(produto);
  const updated = await prisma.produto_imagens.findUniqueOrThrow({ where: { produtoId } });
  const effective = computeEffective(updated);
  return toMeta(updated, { ...effective, status });
}

export async function removerImagem(produtoId: string): Promise<void> {
  await ensureProdutoImagemRecord(produtoId);

  const updated = await prisma.produto_imagens.update({
    where: { produtoId },
    data: {
      status: 'PENDENTE',
      manualUrl: null,
      manualThumbUrl: null,
      manualHash: null,
      manualOrigem: null,
      autoUrl: null,
      autoThumbUrl: null,
      autoHash: null,
      autoOrigem: null,
      autoFonteUrl: null,
      autoEan: null,
      tentativas: 0,
      ultimoErro: null,
    },
  });

  await denormalizeProduto(produtoId, { url: null, thumbUrl: null, status: 'PENDENTE' });
}

export async function reprocessarImagem(produtoId: string): Promise<ImagemStatus> {
  const record = await prisma.produto_imagens.findUnique({ where: { produtoId } });
  if (record?.status === 'MANUAL') {
    return 'MANUAL';
  }

  await prisma.produto_imagens.update({
    where: { produtoId },
    data: {
      status: 'PENDENTE',
      autoUrl: null,
      autoThumbUrl: null,
      autoHash: null,
      autoOrigem: null,
      autoFonteUrl: null,
      autoEan: null,
      tentativas: 0,
      ultimoErro: null,
    },
  });

  const produto = await prisma.produtos.findUniqueOrThrow({ where: { id: produtoId } });
  return processarImagemAutomatica(produto);
}

export async function obterMetadadosImagem(produtoId: string): Promise<ProdutoImagemMeta | null> {
  const record = await prisma.produto_imagens.findUnique({ where: { produtoId } });
  if (!record) return null;
  const effective = computeEffective(record);
  return toMeta(record, effective);
}

export async function listarProdutosComImagens(options: {
  status?: ImagemStatus;
  busca?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: AdminProdutoImagemItem[]; total: number }> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const skip = (page - 1) * limit;

  const where = {
    ...(options.status ? { imagemStatus: options.status } : {}),
    ...(options.busca
      ? {
          OR: [
            { nome: { contains: options.busca, mode: 'insensitive' as const } },
            { codigoBarras: { contains: options.busca } },
            { marca: { contains: options.busca, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [produtosList, total] = await Promise.all([
    prisma.produtos.findMany({
      where,
      include: { produtoImagem: true },
      orderBy: { dataAtualizacao: 'desc' },
      skip,
      take: limit,
    }),
    prisma.produtos.count({ where }),
  ]);

  const items: AdminProdutoImagemItem[] = produtosList.map((p) => {
    const record = p.produtoImagem;
    const effective = computeEffective(record);
    const meta = record
      ? toMeta(record, effective)
      : {
          produtoId: p.id,
          status: (p.imagemStatus ?? 'PENDENTE') as ImagemStatus,
          imagem: p.imagem,
          imagemThumb: p.imagemThumb,
          autoUrl: null,
          autoThumbUrl: null,
          autoOrigem: null,
          autoFonteUrl: null,
          autoEan: null,
          manualUrl: null,
          manualThumbUrl: null,
          manualOrigem: null,
          tentativas: 0,
          ultimoErro: null,
          atualizadoEm: p.dataAtualizacao,
        };

    return {
      ...meta,
      nome: p.nome,
      codigoBarras: p.codigoBarras,
      marca: p.marca,
    };
  });

  return { items, total };
}

export async function runProductImageBackfill(batchSize?: number): Promise<{
  processados: number;
  automatica: number;
  invalida: number;
  pendente: number;
}> {
  const limit = batchSize ?? parseInt(process.env.IMAGE_BACKFILL_BATCH_SIZE || '20', 10);

  const pendentes = await prisma.produto_imagens.findMany({
    where: { status: 'PENDENTE', tentativas: { lt: MAX_IMAGE_ATTEMPTS } },
    take: limit,
    orderBy: { criadoEm: 'asc' },
    include: { produtos: true },
  });

  let automatica = 0;
  let invalida = 0;
  let pendente = 0;

  for (const item of pendentes) {
    const status = await processarImagemAutomatica(item.produtos);
    if (status === 'AUTOMATICA') automatica++;
    else if (status === 'INVALIDA') invalida++;
    else pendente++;

    await new Promise((r) => setTimeout(r, 300));
  }

  return { processados: pendentes.length, automatica, invalida, pendente };
}

function toMeta(
  record: produto_imagens,
  effective: EffectiveImage
): ProdutoImagemMeta {
  return {
    produtoId: record.produtoId,
    status: effective.status,
    imagem: effective.url,
    imagemThumb: effective.thumbUrl,
    autoUrl: record.autoUrl,
    autoThumbUrl: record.autoThumbUrl,
    autoOrigem: record.autoOrigem,
    autoFonteUrl: record.autoFonteUrl,
    autoEan: record.autoEan,
    manualUrl: record.manualUrl,
    manualThumbUrl: record.manualThumbUrl,
    manualOrigem: record.manualOrigem,
    tentativas: record.tentativas,
    ultimoErro: record.ultimoErro,
    atualizadoEm: record.atualizadoEm,
  };
}

export async function enfileirarProdutosSemImagem(limit = 500): Promise<number> {
  const semImagem = await prisma.produtos.findMany({
    where: {
      OR: [
        { imagemStatus: null },
        { imagemStatus: 'PENDENTE' },
        { imagem: null },
      ],
      ativo: true,
    },
    select: { id: true },
    take: limit,
  });

  await marcarPendentesEmLote(semImagem.map((p) => p.id));
  return semImagem.length;
}
