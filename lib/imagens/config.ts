import path from 'path';

export const IMAGE_STORAGE_DIR =
  process.env.IMAGE_STORAGE_DIR ||
  path.join(process.cwd(), 'public', 'uploads', 'produtos');

export const IMAGE_PUBLIC_BASE_URL =
  process.env.IMAGE_PUBLIC_BASE_URL || '/uploads/produtos';

export const OFF_USER_AGENT =
  process.env.OFF_USER_AGENT || 'Precivox/1.0 (contact@precivox.com.br)';

export const IMAGE_BACKFILL_BATCH_SIZE = parseInt(
  process.env.IMAGE_BACKFILL_BATCH_SIZE || '20',
  10
);

export const IMAGE_FULL_MAX_WIDTH = 600;
export const IMAGE_THUMB_MAX_WIDTH = 150;
export const IMAGE_WEBP_QUALITY = 82;
export const IMAGE_THUMB_WEBP_QUALITY = 75;

export const MAX_IMAGE_ATTEMPTS = 3;
