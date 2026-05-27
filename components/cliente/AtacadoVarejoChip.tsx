'use client';

import { useEffect, useState } from 'react';
import { Package, ShoppingBag } from 'lucide-react';
import type { RecomendacaoFormato } from '@/lib/atacado-varejo';

interface Props {
  produtoId: string | undefined;
  mercadoId: string;
}

export function AtacadoVarejoChip({ produtoId, mercadoId }: Props) {
  const [hint, setHint] = useState<{
    recomendacao: RecomendacaoFormato;
    mensagem: string;
    economiaPct: number;
  } | null>(null);

  useEffect(() => {
    if (!produtoId || !mercadoId) return;
    void (async () => {
      try {
        const res = await fetch(
          `/api/cliente/atacado-varejo?mercadoId=${mercadoId}&produtoId=${produtoId}`,
          { credentials: 'include', cache: 'no-store' }
        );
        const json = await res.json();
        if (json.success && json.data.recomendacao !== 'indiferente') {
          setHint({
            recomendacao: json.data.recomendacao,
            mensagem: json.data.mensagem,
            economiaPct: json.data.economiaPct,
          });
        }
      } catch {
        /* ignore */
      }
    })();
  }, [produtoId, mercadoId]);

  if (!hint) return null;

  const atacado = hint.recomendacao === 'atacado';
  const Icon = atacado ? Package : ShoppingBag;

  return (
    <p
      className={`mt-1 flex items-start gap-1 text-[11px] leading-snug ${
        atacado ? 'text-indigo-800' : 'text-slate-700'
      }`}
      title={hint.mensagem}
    >
      <Icon className="mt-0.5 h-3 w-3 shrink-0" />
      <span>
        {atacado ? 'Atacado' : 'Varejo'}: {hint.mensagem}
      </span>
    </p>
  );
}
