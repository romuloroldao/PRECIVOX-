'use client';

import { useEffect, useState } from 'react';
import { enqueueClientFetch } from '@/lib/client-api-queue';

export type MercadoSeloInfo = {
  mercadoId: string;
  tier: number;
  selo: string | null;
  seloCurto: string | null;
};

export function useMercadoSelos(mercadoIds: string[]) {
  const [selos, setSelos] = useState<Record<string, MercadoSeloInfo>>({});

  const key = [...new Set(mercadoIds.filter(Boolean))].sort().join(',');

  useEffect(() => {
    if (!key) {
      setSelos({});
      return;
    }

    void enqueueClientFetch(async () => {
      const res = await fetch(`/api/public/mercado-selo?ids=${encodeURIComponent(key)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSelos(json.data as Record<string, MercadoSeloInfo>);
      }
    });
  }, [key]);

  return selos;
}
