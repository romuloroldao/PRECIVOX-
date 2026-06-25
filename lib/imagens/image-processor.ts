import crypto from 'crypto';
import sharp from 'sharp';
import {
  IMAGE_FULL_MAX_WIDTH,
  IMAGE_THUMB_MAX_WIDTH,
  IMAGE_THUMB_WEBP_QUALITY,
  IMAGE_WEBP_QUALITY,
} from './config';
import { storeContentAddressed } from './storage';
import type { ProcessedImage } from './types';

export function computeHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(20000),
    headers: { Accept: 'image/*' },
  });
  if (!res.ok) {
    throw new Error(`Falha ao baixar imagem: HTTP ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length < 100) {
    throw new Error('Imagem baixada inválida ou muito pequena');
  }
  return buffer;
}

export async function processImageBuffer(source: Buffer): Promise<{
  fullBuffer: Buffer;
  thumbBuffer: Buffer;
  fullHash: string;
  thumbHash: string;
}> {
  const fullBuffer = await sharp(source)
    .rotate()
    .resize(IMAGE_FULL_MAX_WIDTH, IMAGE_FULL_MAX_WIDTH, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: IMAGE_WEBP_QUALITY })
    .toBuffer();

  const thumbBuffer = await sharp(source)
    .rotate()
    .resize(IMAGE_THUMB_MAX_WIDTH, IMAGE_THUMB_MAX_WIDTH, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: IMAGE_THUMB_WEBP_QUALITY })
    .toBuffer();

  return {
    fullBuffer,
    thumbBuffer,
    fullHash: computeHash(fullBuffer),
    thumbHash: computeHash(thumbBuffer),
  };
}

export async function processAndStoreFromUrl(url: string): Promise<ProcessedImage> {
  const raw = await downloadImage(url);
  return processAndStoreFromBuffer(raw);
}

export async function processAndStoreFromBuffer(source: Buffer): Promise<ProcessedImage> {
  const { fullBuffer, thumbBuffer, fullHash, thumbHash } =
    await processImageBuffer(source);

  const fullUrl = await storeContentAddressed(fullBuffer, fullHash);
  const thumbUrl = await storeContentAddressed(thumbBuffer, thumbHash, '_thumb');

  return {
    fullBuffer,
    thumbBuffer,
    fullHash,
    thumbHash,
    fullUrl,
    thumbUrl,
  };
}
