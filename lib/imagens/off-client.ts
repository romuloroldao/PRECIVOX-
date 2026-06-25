import { getCached } from '@/lib/redis';
import { OFF_USER_AGENT } from './config';
import type { OffImageResult } from './types';

const OFF_BASE = 'https://world.openfoodfacts.org';

interface OffProduct {
  code?: string;
  product_name?: string;
  image_url?: string;
  image_front_url?: string;
  image_front_small_url?: string;
  image_small_url?: string;
  brands?: string;
}

interface OffProductResponse {
  status: number;
  product?: OffProduct;
}

interface OffSearchResponse {
  products?: OffProduct[];
}

function pickBestImageUrl(product: OffProduct): string | null {
  return (
    product.image_front_url ||
    product.image_url ||
    product.image_front_small_url ||
    product.image_small_url ||
    null
  );
}

function buildAttribution(product: OffProduct): string {
  const name = product.product_name || 'Produto';
  const brand = product.brands ? ` — ${product.brands}` : '';
  return `Open Food Facts: ${name}${brand}`;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': OFF_USER_AGENT,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Busca imagem no Open Food Facts por EAN (código de barras).
 */
export async function buscarImagemPorEan(ean: string): Promise<OffImageResult | null> {
  const normalized = ean.replace(/\D/g, '');
  if (!normalized) return null;

  const cacheKey = `off:ean:${normalized}`;
  return getCached(
    cacheKey,
    async () => {
      const data = await fetchJson<OffProductResponse>(
        `${OFF_BASE}/api/v2/product/${normalized}.json`
      );
      if (!data || data.status !== 1 || !data.product) return null;

      const imageUrl = pickBestImageUrl(data.product);
      if (!imageUrl) return null;

      return {
        imageUrl,
        sourceUrl: `${OFF_BASE}/product/${normalized}`,
        ean: normalized,
        productName: data.product.product_name,
        attribution: buildAttribution(data.product),
      };
    },
    86400
  );
}

/**
 * Fallback: busca por nome no Open Food Facts.
 */
export async function buscarImagemPorNome(
  nome: string,
  marca?: string | null
): Promise<OffImageResult | null> {
  const query = [nome, marca].filter(Boolean).join(' ').trim();
  if (!query) return null;

  const cacheKey = `off:search:${query.toLowerCase().slice(0, 120)}`;
  return getCached(
    cacheKey,
    async () => {
      const params = new URLSearchParams({
        search_terms: query,
        search_simple: '1',
        action: 'process',
        json: '1',
        page_size: '5',
        fields: 'code,product_name,image_url,image_front_url,image_front_small_url,brands',
      });

      const data = await fetchJson<OffSearchResponse>(
        `${OFF_BASE}/cgi/search.pl?${params.toString()}`
      );
      if (!data?.products?.length) return null;

      for (const product of data.products) {
        const imageUrl = pickBestImageUrl(product);
        if (!imageUrl) continue;

        const ean = product.code?.replace(/\D/g, '') || undefined;
        return {
          imageUrl,
          sourceUrl: ean ? `${OFF_BASE}/product/${ean}` : OFF_BASE,
          ean,
          productName: product.product_name,
          attribution: buildAttribution(product),
        };
      }

      return null;
    },
    43200
  );
}

/**
 * Resolve imagem: EAN primeiro, depois nome.
 */
export async function resolverImagemOff(
  nome: string,
  codigoBarras?: string | null,
  marca?: string | null
): Promise<OffImageResult | null> {
  if (codigoBarras) {
    const porEan = await buscarImagemPorEan(codigoBarras);
    if (porEan) return porEan;
  }
  return buscarImagemPorNome(nome, marca);
}
