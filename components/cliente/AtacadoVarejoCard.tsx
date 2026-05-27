'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Scale, Package, ShoppingBag } from 'lucide-react';
import type { RecomendacaoFormato } from '@/lib/atacado-varejo';

interface Props {
  mercadoId: string | null;
}

const ICON: Record<RecomendacaoFormato, typeof Package> = {
  atacado: Package,
  varejo: ShoppingBag,
  indiferente: Scale,
};

export function AtacadoVarejoCard({ mercadoId }: Props) {
  const [data, setData] = useState<{
    itens: {
      nomeVarejo: string;
      nomeAtacado: string;
      economiaPct: number;
      recomendacao: RecomendacaoFormato;
      mensagem: string;
      unidadeBase: string;
      precoPorUnidadeVarejo: number;
      precoPorUnidadeAtacado: number;
      volumeFamiliarPessoas: number;
    }[];
    resumo: string;
    volumeFamiliarPessoas: number;
  } | null>(null);

  useEffect(() => {
    if (!mercadoId) return;
    void (async () => {
      try {
        const res = await fetch(`/api/cliente/atacado-varejo?mercadoId=${mercadoId}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        const json = await res.json();
        if (json.success && json.data.itens?.length) setData(json.data);
      } catch {
        /* ignore */
      }
    })();
  }, [mercadoId]);

  if (!mercadoId || !data?.itens.length) return null;

  return (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm">
      <div className="flex items-start gap-2">
        <Scale className="h-5 w-5 shrink-0 text-indigo-700" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-indigo-950">Atacado vs varejo</h3>
          <p className="mt-1 text-xs text-indigo-900/80">
            {data.resumo} · família ~{data.volumeFamiliarPessoas} pessoas
          </p>
          <ul className="mt-2 space-y-2">
            {data.itens.slice(0, 4).map((item, i) => {
              const Icon = ICON[item.recomendacao];
              return (
                <li key={i} className="text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-gray-800">
                    <Icon className="h-3.5 w-3.5 text-indigo-600" />
                    {item.recomendacao === 'atacado' ? 'Atacado' : 'Varejo'} ·{' '}
                    {item.nomeVarejo.split(' ').slice(0, 3).join(' ')}…
                  </div>
                  <p className="mt-0.5 text-[11px] text-gray-600">
                    {item.precoPorUnidadeVarejo.toFixed(2)} →{' '}
                    {item.precoPorUnidadeAtacado.toFixed(2)} R$/{item.unidadeBase}
                    {item.economiaPct > 0 && ` (−${item.economiaPct.toFixed(0)}% no maior)`}
                  </p>
                  <p className="text-[11px] text-gray-500">{item.mensagem}</p>
                </li>
              );
            })}
          </ul>
          <Link
            href="/cliente/busca"
            className="mt-3 inline-block text-xs font-semibold text-precivox-blue hover:underline"
          >
            Comparar na busca →
          </Link>
        </div>
      </div>
    </div>
  );
}
