'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProductImageProps {
  src?: string | null;
  thumbSrc?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'card';
  status?: string | null;
  className?: string;
  imageClassName?: string;
}

const sizeClasses = {
  xs: 'h-10 w-10',
  sm: 'h-12 w-12',
  md: 'h-14 w-14',
  lg: 'h-48 w-full',
  card: 'h-40 w-full sm:h-44',
};

/**
 * `sizes` informa ao Next o tamanho renderizado para evitar warning de layout.
 * As imagens já são webp pré-dimensionadas (full ~600px, thumb ~150px) e o
 * armazenamento é content-addressed em disco, então usamos `unoptimized` para
 * não reprocessar via /_next/image (desnecessário e instável com arquivos
 * gravados em runtime / URLs legadas externas).
 */
const sizeSizes: Record<NonNullable<ProductImageProps['size']>, string> = {
  xs: '40px',
  sm: '48px',
  md: '56px',
  lg: '(max-width: 640px) 100vw, 300px',
  card: '(max-width: 640px) 100vw, 300px',
};

export function ProductImage({
  src,
  thumbSrc,
  alt,
  size = 'md',
  status,
  className,
  imageClassName,
}: ProductImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const displaySrc = thumbSrc || src;
  const showPlaceholder = !displaySrc || error || status === 'PENDENTE' || status === 'INVALIDA';
  const isLarge = size === 'lg' || size === 'card';

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden bg-slate-50',
        isLarge ? 'rounded-t-xl' : 'rounded-lg',
        sizeClasses[size],
        className
      )}
    >
      {!showPlaceholder && (
        <>
          {!loaded && (
            <div
              className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100"
              aria-hidden
            />
          )}
          <Image
            src={displaySrc!}
            alt={alt}
            fill
            sizes={sizeSizes[size]}
            loading="lazy"
            unoptimized
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={cn(
              'object-contain p-1 transition-opacity duration-200',
              loaded ? 'opacity-100' : 'opacity-0',
              imageClassName
            )}
          />
        </>
      )}

      {showPlaceholder && (
        <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
          <Package
            className={cn(isLarge ? 'h-10 w-10' : size === 'xs' ? 'h-4 w-4' : 'h-6 w-6')}
            aria-hidden
          />
          {status === 'PENDENTE' && isLarge && (
            <span className="text-[10px] font-medium text-slate-400">Carregando…</span>
          )}
        </div>
      )}
    </div>
  );
}
