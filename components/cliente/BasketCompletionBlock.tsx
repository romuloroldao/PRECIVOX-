'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { PackagePlus, Loader2, Sparkles, Clock } from 'lucide-react';
import type { ItemLista } from '@/app/context/ListaContext';

type Sugestao = {
  produtoId: string;
  nome: string;
  confianca: number;
  motivo: string;
};

interface Props {
  itens: ItemLista[];
}

function CardShell({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: 'default' | 'empty';
}) {
  const border =
    variant === 'empty' ? 'border-sky-100 bg-sky-50/60' : 'border-sky-200 bg-gradient-to-br from-sky-50 to-white';
  return (
    <div className={`rounded-xl border p-3 shadow-sm ${border}`}>
      <div className="flex items-start gap-2">
        {variant === 'empty' ? (
          <Clock className="h-4 w-4 shrink-0 text-sky-600" />
        ) : (
          <PackagePlus className="h-4 w-4 shrink-0 text-sky-700" />
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function BasketCompletionBlock({ itens }: Props) {
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [data, setData] = useState<{ itens: Sugestao[]; explicacao: string } | null>(null);

  const mercadoId = itens[0]?.unidade.mercado.id ?? null;
  const produtoIds = useMemo(
    () =>
      itens
        .map((i) => i.produtoCatalogoId)
        .filter((id): id is string => Boolean(id)),
    [itens]
  );
  const chave = `${mercadoId}:${produtoIds.join(',')}`;

  useEffect(() => {
    if (!mercadoId || produtoIds.length === 0) {
      setData(null);
      setFetched(false);
      setLoading(false);
      return;
    }
    setFetched(false);
    const t = setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const q = new URLSearchParams({
            mercadoId,
            produtoIds: produtoIds.join(','),
            limite: '5',
          });
          const res = await fetch(`/api/cliente/basket-completion?${q}`, {
            credentials: 'include',
            cache: 'no-store',
          });
          const json = await res.json();
          if (json.success) setData(json.data);
          else setData({ itens: [], explicacao: 'Não foi possível carregar sugestões agora.' });
        } catch {
          setData({ itens: [], explicacao: 'Não foi possível carregar sugestões agora.' });
        } finally {
          setLoading(false);
          setFetched(true);
        }
      })();
    }, 600);
    return () => clearTimeout(t);
  }, [chave, mercadoId, produtoIds]);

  if (!mercadoId || itens.length === 0) return null;

  if (produtoIds.length === 0) {
    return (
      <CardShell variant="empty">
        <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-sky-900">
          <Sparkles className="h-3 w-3" />
          Completar cesta (ML leve)
        </p>
        <p className="mt-1 text-[11px] leading-snug text-sky-900/80">
          Adicione produtos pelo catálogo (botão na busca) para liberar sugestões de complemento.
        </p>
      </CardShell>
    );
  }

  if (loading && !fetched) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2 text-xs text-sky-900">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Analisando complementos da cesta…
      </div>
    );
  }

  if (fetched && data && data.itens.length === 0) {
    return (
      <CardShell variant="empty">
        <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-sky-900">
          <Sparkles className="h-3 w-3" />
          Complementos em breve
        </p>
        <p className="mt-1 text-[11px] leading-snug text-sky-900/80">
          {data.explicacao ||
            'Ainda estamos aprendendo o que costuma ir junto na sua cesta. Continue usando a lista no PRECIVOX.'}
        </p>
        <p className="mt-2 text-[11px] text-sky-800/70">
          Quanto mais listas e compras confirmadas, melhores ficam as sugestões.
        </p>
      </CardShell>
    );
  }

  if (!data?.itens?.length) return null;

  return (
    <CardShell>
      <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-sky-900">
        <Sparkles className="h-3 w-3" />
        Completar cesta (ML leve)
      </p>
      <p className="mt-1 text-[11px] leading-snug text-sky-900/80">{data.explicacao}</p>
      <ul className="mt-2 space-y-1">
        {data.itens.map((s) => (
          <li key={s.produtoId} className="text-xs text-gray-800">
            <Link
              href={`/cliente/busca?pref=${encodeURIComponent(s.nome.slice(0, 60))}`}
              className="font-medium text-sky-800 hover:underline"
            >
              {s.nome}
            </Link>
            <span className="text-gray-500"> — {s.motivo}</span>
          </li>
        ))}
      </ul>
    </CardShell>
  );
}
