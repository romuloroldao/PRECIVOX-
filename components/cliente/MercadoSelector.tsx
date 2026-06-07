'use client';

import { useEffect, useState } from 'react';
import { Store } from 'lucide-react';

type MercadoOption = { id: string; nome: string };

type MercadoSelectorProps = {
  value: string;
  onChange: (mercadoId: string) => void;
  className?: string;
};

export function MercadoSelector({ value, onChange, className = '' }: MercadoSelectorProps) {
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

  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <label htmlFor="mercado-filtro" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <Store className="h-3.5 w-3.5" />
        Mercado
      </label>
      <select
        id="mercado-filtro"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full min-w-[180px] rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm focus:border-precivox-blue focus:outline-none focus:ring-2 focus:ring-precivox-blue/20 disabled:opacity-60 sm:max-w-xs"
      >
        <option value="">
          {loading
            ? 'Carregando mercados…'
            : mercados.length > 0
              ? `Todos os mercados (${mercados.length})`
              : 'Todos os mercados'}
        </option>
        {mercados.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nome}
          </option>
        ))}
      </select>
      {!loading && mercados.length > 0 && (
        <p className="text-[11px] text-gray-500">
          {mercados.length} mercado{mercados.length === 1 ? '' : 's'} ativo
          {mercados.length === 1 ? '' : 's'} no catálogo
        </p>
      )}
    </div>
  );
}
