'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { HubIntentId, HubModality, StructuredResponse } from '@/lib/hub/types';
import { useToast } from '@/components/ToastContainer';

/**
 * Envia texto/chip/foto ao Hub e navega para a superfície visual (não chat).
 */
export function useHubIntent(mercadoId?: string | null) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<StructuredResponse | null>(null);

  const applyResponse = useCallback(
    (data: StructuredResponse) => {
      setLast(data);
      if (data.explanation) {
        success(data.explanation);
      }
      if (data.ui.href) {
        router.push(data.ui.href);
        return;
      }
      if (data.ui.type === 'hub_clarify') {
        return;
      }
    },
    [router, success]
  );

  const submit = useCallback(
    async (input: string, intentHint?: HubIntentId, modality: HubModality = 'text') => {
      if (busy) return null;
      setBusy(true);
      try {
        const res = await fetch('/api/cliente/hub/intent', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input,
            modality,
            intentHint,
            context: {
              mercadoId: mercadoId || undefined,
            },
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error || 'Não foi possível entender o pedido');
        }
        const data = json.data as StructuredResponse;
        applyResponse(data);
        return data;
      } catch (e) {
        toastError(e instanceof Error ? e.message : 'Tente de novo');
        return null;
      } finally {
        setBusy(false);
      }
    },
    [busy, mercadoId, applyResponse, toastError]
  );

  return { submit, busy, last };
}
