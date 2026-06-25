import type { ImagemStatus } from '@prisma/client';

export interface OffImageResult {
  imageUrl: string;
  sourceUrl: string;
  ean?: string;
  productName?: string;
  attribution: string;
}

export interface ProcessedImage {
  fullBuffer: Buffer;
  thumbBuffer: Buffer;
  fullHash: string;
  thumbHash: string;
  fullUrl: string;
  thumbUrl: string;
}

export interface EffectiveImage {
  url: string | null;
  thumbUrl: string | null;
  status: ImagemStatus;
}

export interface ProdutoImagemMeta {
  produtoId: string;
  status: ImagemStatus;
  imagem: string | null;
  imagemThumb: string | null;
  autoUrl: string | null;
  autoThumbUrl: string | null;
  autoOrigem: string | null;
  autoFonteUrl: string | null;
  autoEan: string | null;
  manualUrl: string | null;
  manualThumbUrl: string | null;
  manualOrigem: string | null;
  tentativas: number;
  ultimoErro: string | null;
  atualizadoEm: Date;
}

export interface AdminProdutoImagemItem extends ProdutoImagemMeta {
  nome: string;
  codigoBarras: string | null;
  marca: string | null;
}
