'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, TrendingDown, Loader2 } from 'lucide-react';
import type { ItemLista } from '@/app/context/ListaContext';
import { fetchAnaliseLista, type ListaAnaliseResultado } from '@/lib/lista-ia-analysis';
import { useSession } from '@/lib/hooks/useUnifiedSession';
import { cn } from '@/lib/utils';

type Props = {
  itens: ItemLista[];
  listaAtivaId: string | null;
  /** Mínimo de itens para disparar análise */
  minItens?: number;
  className?: string;
};

/**
 * Análise da lista via AI Gateway — explica economia e eficiência em linguagem simples.
 */
export function ListaAnaliseIaBlock({
  itens,
  listaAtivaId,
  minItens = 2,
  className,
}: Props) {
  const { status } = useSession();
  const [analise, setAnalise] = useState<ListaAnaliseResultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, ListaAnaliseResultado>>(new Map());

  const chave = useMemo(
    () => itens.map((i) => `${i.id}:${i.quantidade}:${preco(i)}`).join('|'),
    [itens]
  );

  const logado = status === 'authenticated';

  useEffect(() => {
    if (!logado || itens.length < minItens) {
      setAnalise(null);
      setErro(null);
      return;
    }

    const cached = cacheRef.current.get(chave);
    if (cached) {
      setAnalise(cached);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setErro(null);
      void fetchAnaliseLista(itens, listaAtivaId)
        .then((result) => {
          if (cancelled) return;
          if (result) {
            cacheRef.current.set(chave, result);
            setAnalise(result);
          } else {
            setAnalise(null);
          }
        })
        .catch((e) => {
          if (!cancelled) {
            setErro(e instanceof Error ? e.message : 'Não foi possível analisar agora');
            setAnalise(null);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 1200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [chave, itens, listaAtivaId, logado, minItens]);

  if (!logado) {
    return (
      <p className={cn('text-[11px] leading-relaxed text-emerald-800/70', className)}>
        Entre na sua conta para ver dicas personalizadas sobre sua lista.
      </p>
    );
  }

  if (itens.length < minItens) return null;

  if (loading && !analise) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border border-violet-200/80 bg-violet-50/60 px-3 py-2.5 text-xs text-violet-900',
          className
        )}
      >
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-600" />
        Analisando sua lista para encontrar oportunidades…
      </div>
    );
  }

  if (erro && !analise) {
    return (
      <p className={cn('text-[11px] text-gray-500', className)}>
        Dicas da lista indisponíveis no momento. Você ainda pode usar a rota sugerida abaixo.
      </p>
    );
  }

  if (!analise) return null;

  const economia = analise.estimatedSavings;
  const score = Math.round(analise.efficiencyScore);

  return (
    <div
      className={cn(
        'rounded-xl border border-violet-200/90 bg-gradient-to-br from-violet-50 to-white p-3 shadow-sm',
        className
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-violet-950">
        <Sparkles className="h-4 w-4 shrink-0 text-violet-600" />
        <span className="text-xs font-bold uppercase tracking-wide">Análise da sua lista</span>
        {analise.offline && (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
            modo básico
          </span>
        )}
      </div>

      {(economia > 0 || score > 0) && (
        <div className="mb-2 flex flex-wrap gap-2">
          {economia > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
              <TrendingDown className="h-3 w-3" />
              Até R$ {economia.toFixed(2).replace('.', ',')} de economia possível
            </span>
          )}
          {score > 0 && (
            <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-800">
              Eficiência: {score}/100
            </span>
          )}
        </div>
      )}

      {analise.explicacao && (
        <p className="mb-2 text-[11px] leading-relaxed text-violet-950/90">{analise.explicacao}</p>
      )}

      {analise.insights.length > 0 && (
        <ul className="space-y-1.5 text-[11px] leading-relaxed text-violet-950/85">
          {analise.insights.slice(0, 4).map((insight, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="shrink-0 text-violet-500">·</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      )}

      {analise.suggestions.length > 0 && (
        <div className="mt-2 border-t border-violet-100 pt-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-violet-800">
            Sugestões
          </p>
          <ul className="space-y-1 text-[11px] text-violet-950/80">
            {analise.suggestions.slice(0, 2).map((s, i) => (
              <li key={s.id ?? i} className="line-clamp-2">
                {s.title || s.description || 'Oportunidade identificada'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analise.warnings.length > 0 && (
        <p className="mt-2 text-[10px] text-amber-800/90">{analise.warnings[0]}</p>
      )}
    </div>
  );
}

function preco(item: ItemLista): number {
  return item.emPromocao && item.precoPromocional ? item.precoPromocional : item.preco;
}
