'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { PricingAssistidoCard } from '@/components/gestor/PricingAssistidoCard';
import { BenchmarkPrecoRegionalCard } from '@/components/gestor/BenchmarkPrecoRegionalCard';

export default function ModuloPromocoesPage() {
  const [mercadoId, setMercadoId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/markets', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        const id = json.data?.[0]?.id as string | undefined;
        if (id) setMercadoId(id);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  return (
    <DashboardLayout role="GESTOR">
      <div className="space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 p-8 text-white">
          <Link href="/gestor/ia" className="mb-2 inline-block text-sm opacity-75 hover:opacity-100">
            ← Voltar ao Dashboard
          </Link>
          <h1 className="mb-2 text-3xl font-bold">Pricing assistido</h1>
          <p className="text-lg opacity-90">
            Sugestões explicáveis com impacto estimado — aprovação em 1 toque no catálogo
          </p>
        </div>

        {mercadoId ? (
          <>
            <PricingAssistidoCard mercadoId={mercadoId} />
            <BenchmarkPrecoRegionalCard mercadoId={mercadoId} />
          </>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
            Carregando mercado…
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-900">Como funciona</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Motor de promoção analisa giro, estoque e ciclo de vida do SKU</li>
            <li>Radar do bairro prioriza itens com demanda latente</li>
            <li>Ao aprovar, o preço promocional entra no catálogo com truth layer do gestor</li>
            <li>Ação registrada em histórico operacional (`acoes_gestor`)</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
