'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';

export function DespensaCard({ mercadoId }: { mercadoId?: string | null }) {
  const href = mercadoId
    ? `/cliente/despensa?mercadoId=${encodeURIComponent(mercadoId)}`
    : '/cliente/despensa';

  return (
    <Link
      href={href}
      className="block rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 shadow-sm transition hover:border-teal-300"
    >
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-teal-100 p-2 text-teal-800">
          <Package className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-gray-900">Despensa digital</p>
          <p className="mt-0.5 text-sm text-gray-600">
            Veja o que está acabando e o que repor esta semana
          </p>
        </div>
      </div>
    </Link>
  );
}
