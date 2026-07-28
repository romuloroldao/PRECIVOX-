'use client';

import { useEffect, useState } from 'react';
import { Store } from 'lucide-react';

type MercadoOption = { id: string; nome: string };

type MercadoSelectorProps = {
  value: string;
  onChange: (mercadoId: string) => void;
  className?: string;
  /**
   * `filter` — opção vazia = “Todos os mercados” (busca).
   * `required` — opção vazia = “Selecione um mercado…” (despensa, etc.).
   */
  mode?: 'filter' | 'required';
};

export function MercadoSelector({
  value,
  onChange,
  className = '',
  mode = 'filter',
}: MercadoSelectorProps) {
  const [mercados, setMercados] = useState<MercadoOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/public/mercados?ativo=true', { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) {
          setMercados(
            data
              .filter((m: { id?: string; nome?: string }) => m.id && m.nome)
              .map((m: { id: string; nome: string }) => ({ id: m.id, nome: m.nome }))
              .sort((a: MercadoOption, b: MercadoOption) => a.nome.localeCompare(b.nome, 'pt-BR'))
          );
        }
      } catch {
        if (!cancelled) setMercados([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const emptyLabel = loading
    ? 'Carregando mercados…'
    : mode === 'required'
      ? 'Selecione um mercado…'
      : mercados.length > 0
        ? `Todos os mercados (${mercados.length})`
        : 'Todos os mercados';

  const needsPick = mode === 'required' && !value && !loading;

  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <label
        htmlFor="mercado-filtro"
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500"
      >
        <Store className="h-3.5 w-3.5" />
        Mercado
        {mode === 'required' && <span className="normal-case font-normal text-amber-700">· obrigatório</span>}
      </label>
      <select
        id="mercado-filtro"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        aria-invalid={needsPick}
        className={
          needsPick
            ? 'w-full min-w-[180px] rounded-lg border-2 border-amber-400 bg-amber-50 px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30 disabled:opacity-60 sm:max-w-xs'
            : 'w-full min-w-[180px] rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm focus:border-precivox-blue focus:outline-none focus:ring-2 focus:ring-precivox-blue/20 disabled:opacity-60 sm:max-w-xs'
        }
      >
        <option value="">{emptyLabel}</option>
        {mercados.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nome}
          </option>
        ))}
      </select>
      {!loading && mercados.length > 0 && mode === 'filter' && (
        <p className="text-[11px] text-gray-500">
          {mercados.length} mercado{mercados.length === 1 ? '' : 's'} ativo
          {mercados.length === 1 ? '' : 's'} no catálogo
        </p>
      )}
      {needsPick && (
        <p className="text-xs font-medium text-amber-800">
          Escolha um mercado na lista — a despensa é por mercado, não dá para ver “todos” de uma vez.
        </p>
      )}
    </div>
  );
}
