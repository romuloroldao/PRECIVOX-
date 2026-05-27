'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

interface Props {
  produtoId: string | undefined;
  mercadoId: string;
}

export function ProvaSocialChip({ produtoId, mercadoId }: Props) {
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    if (!produtoId || !mercadoId) return;
    void (async () => {
      try {
        const res = await fetch(
          `/api/cliente/prova-social?mercadoId=${mercadoId}&produtoId=${produtoId}`,
          { credentials: 'include', cache: 'no-store' }
        );
        const json = await res.json();
        if (json.success && json.data?.mensagem) setMensagem(json.data.mensagem);
      } catch {
        /* ignore */
      }
    })();
  }, [produtoId, mercadoId]);

  if (!mensagem) return null;

  return (
    <p className="mt-1 flex items-start gap-1 text-[11px] leading-snug text-sky-800">
      <Users className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
      <span>{mensagem}</span>
    </p>
  );
}
