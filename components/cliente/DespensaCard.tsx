'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';

export function DespensaCard(_props?: { mercadoId?: string | null }) {
  return (
    <Link
      href="/cliente/despensa"
      className="block rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 shadow-sm transition hover:border-teal-300"
    >
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-teal-100 p-2 text-teal-800">
          <Package className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-gray-900">Despensa</p>
          <p className="mt-0.5 text-sm text-gray-600">
            O que costuma acabar em casa — inclua na compra quando precisar
          </p>
        </div>
      </div>
    </Link>
  );
}
