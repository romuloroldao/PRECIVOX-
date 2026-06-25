import fs from 'fs/promises';
import path from 'path';
import { IMAGE_PUBLIC_BASE_URL, IMAGE_STORAGE_DIR } from './config';

export function hashToFilename(hash: string, suffix = ''): string {
  return `${hash}${suffix}.webp`;
}

export function hashToPublicUrl(hash: string, suffix = ''): string {
  const base = IMAGE_PUBLIC_BASE_URL.replace(/\/$/, '');
  return `${base}/${hashToFilename(hash, suffix)}`;
}

export async function ensureStorageDir(): Promise<void> {
  await fs.mkdir(IMAGE_STORAGE_DIR, { recursive: true });
}

/**
 * Grava buffer content-addressed. Reutiliza arquivo se hash já existir (dedupe).
 */
export async function storeContentAddressed(
  buffer: Buffer,
  hash: string,
  suffix = ''
): Promise<string> {
  await ensureStorageDir();
  const filename = hashToFilename(hash, suffix);
  const filePath = path.join(IMAGE_STORAGE_DIR, filename);

  try {
    await fs.access(filePath);
    return hashToPublicUrl(hash, suffix);
  } catch {
    await fs.writeFile(filePath, buffer);
    return hashToPublicUrl(hash, suffix);
  }
}
