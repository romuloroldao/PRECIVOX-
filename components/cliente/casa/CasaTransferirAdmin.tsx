'use client';

import { useState } from 'react';
import { CASA } from '@/lib/ux-copy-casa';

export function CasaTransferirAdmin({
  membros,
  meuUserId,
  busy,
  onTransferir,
}: {
  membros: { userId: string; nome: string; role: string }[];
  meuUserId?: string;
  busy: boolean;
  onTransferir: (novoAdminUserId: string) => Promise<void>;
}) {
  const outros = membros.filter((m) => m.userId !== meuUserId);
  const [selecionado, setSelecionado] = useState(outros[0]?.userId ?? '');

  if (outros.length === 0) return null;

  return (
    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
      <p className="text-sm font-semibold text-gray-900">{CASA.transferirAdmin.titulo}</p>
      <p className="text-xs text-gray-600">{CASA.transferirAdmin.descricao}</p>
      <label className="block text-xs font-medium text-gray-700">
        {CASA.transferirAdmin.label}
        <select
          value={selecionado}
          onChange={(e) => setSelecionado(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {outros.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.nome}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={busy || !selecionado}
        onClick={() => void onTransferir(selecionado)}
        className="w-full rounded-lg border border-indigo-300 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
      >
        {CASA.transferirAdmin.cta}
      </button>
    </div>
  );
}
