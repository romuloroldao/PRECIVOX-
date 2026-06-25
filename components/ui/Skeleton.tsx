'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-slate-200/80', className)}
      aria-hidden
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4" aria-hidden>
      <Skeleton className="mb-3 h-32 w-full" />
      <Skeleton className="mb-2 h-4 w-3/4" />
      <Skeleton className="mb-2 h-3 w-1/2" />
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-label="Carregando produtos"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3" aria-hidden>
      <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  );
}
