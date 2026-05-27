'use client';

import Link from 'next/link';
import { Users, ChevronRight } from 'lucide-react';
import { useRaioFamiliar } from '@/app/hooks/useRaioFamiliar';

export function RaioFamiliarCard() {
  const { data, loading } = useRaioFamiliar();

  if (loading && !data) return null;

  if (!data?.ativo) {
    return (
      <Link
        href="/cliente/familia"
        className="block rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm hover:border-indigo-300"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-start gap-2">
            <Users className="h-5 w-5 shrink-0 text-indigo-700" />
            <div>
              <p className="font-semibold text-indigo-950">Raio familiar</p>
              <p className="mt-0.5 text-sm text-indigo-800/90">
                Compartilhe listas e preferências da casa com quem mora com você.
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-indigo-400" />
        </div>
      </Link>
    );
  }

  const n = data.circle?.membros.length ?? 0;
  const lista = data.circle?.listaCompartilhada;

  return (
    <Link
      href="/cliente/familia"
      className="block rounded-xl border border-indigo-300 bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-white shadow-md hover:from-indigo-700"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-200">
            Raio familiar ativo
          </p>
          <p className="text-lg font-bold">{data.circle?.nomeCasa}</p>
          <p className="mt-1 text-sm text-indigo-100">
            {n} {n === 1 ? 'pessoa' : 'pessoas'}
            {lista?.itens?.length
              ? ` · lista com ${lista.itens.length} itens`
              : ' · lista compartilhada'}
          </p>
          {lista?.atualizadoPorNome && (
            <p className="mt-1 text-[11px] text-indigo-200">
              Atualizado por {lista.atualizadoPorNome}
            </p>
          )}
        </div>
        <ChevronRight className="h-6 w-6 shrink-0 opacity-80" />
      </div>
    </Link>
  );
}
