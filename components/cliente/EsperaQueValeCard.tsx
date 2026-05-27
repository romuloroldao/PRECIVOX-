'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, TrendingDown, Zap } from 'lucide-react';
import type { RecomendacaoTiming } from '@/lib/espera-que-vale';

interface Props {
  mercadoId: string | null;
}

const ICON: Record<RecomendacaoTiming, typeof Clock> = {
  esperar: Clock,
  comprar_agora: Zap,
  promo_ativa: Zap,
  neutro: TrendingDown,
};

const BADGE: Record<RecomendacaoTiming, string> = {
  esperar: 'bg-amber-100 text-amber-900',
  comprar_agora: 'bg-emerald-100 text-emerald-900',
  promo_ativa: 'bg-violet-100 text-violet-900',
  neutro: 'bg-gray-100 text-gray-700',
};

const LABEL: Record<RecomendacaoTiming, string> = {
  esperar: 'Esperar',
  comprar_agora: 'Comprar',
  promo_ativa: 'Promo',
  neutro: 'Neutro',
};

export function EsperaQueValeCard({ mercadoId }: Props) {
  const [data, setData] = useState<{
    itens: {
      produtoId: string;
      nome: string;
      recomendacao: RecomendacaoTiming;
      mensagem: string;
      precoAtual: number;
      volatilidadePct: number | null;
    }[];
    resumo: string;
  } | null>(null);

  useEffect(() => {
    if (!mercadoId) return;
    void (async () => {
      try {
        const res = await fetch(`/api/cliente/espera-que-vale?mercadoId=${mercadoId}`, {
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
    <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm">
      <div className="flex items-start gap-2">
        <Clock className="h-5 w-5 shrink-0 text-sky-700" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sky-950">Espera que vale</h3>
          <p className="mt-1 text-xs text-sky-900/80">{data.resumo}</p>
          <ul className="mt-2 space-y-2">
            {data.itens.slice(0, 5).map((item) => {
              const Icon = ICON[item.recomendacao];
              return (
                <li key={item.produtoId} className="text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-800">{item.nome}</span>
                    <span
                      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ${BADGE[item.recomendacao]}`}
                    >
                      <Icon className="h-3 w-3" />
                      {LABEL[item.recomendacao]}
                    </span>
                    <span className="text-gray-500">
                      R$ {item.precoAtual.toFixed(2).replace('.', ',')}
                      {item.volatilidadePct != null && ` · vol. ~${item.volatilidadePct}%`}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-gray-600">{item.mensagem}</p>
                </li>
              );
            })}
          </ul>
          <Link
            href="/cliente/busca"
            className="mt-3 inline-block text-xs font-semibold text-precivox-blue hover:underline"
          >
            Ver produtos na busca →
          </Link>
        </div>
      </div>
    </div>
  );
}
