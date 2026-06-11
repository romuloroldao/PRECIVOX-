'use client';

import { useCallback, useEffect, useState } from 'react';
import { CreditCard, RefreshCw } from 'lucide-react';

interface Props {
  mercadoId?: string;
}

type SaasData = {
  planoNome: string | null;
  valorMensal: number | null;
  tierLabel: string;
  featuresLabels: string[];
  bloqueadasLabels: string[];
  limiteUnidades: number | null;
  explicacao: string;
};

export function MonetizacaoSaasGestorCard({ mercadoId }: Props) {
  const [data, setData] = useState<SaasData | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (mercadoId) q.set('mercadoId', mercadoId);
    try {
      const res = await fetch(`/api/gestor/monetizacao/saas?${q}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, [mercadoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
        Carregando plano SaaS…
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-semibold text-emerald-950">
          <CreditCard className="h-4 w-4 text-emerald-600" />
          Plano PRECIVOX — {data.tierLabel}
        </h3>
        <button
          type="button"
          onClick={() => void carregar()}
          className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-100"
          aria-label="Atualizar"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 text-xs text-emerald-900/75">{data.explicacao}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {data.planoNome && (
          <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-emerald-200">
            {data.planoNome}
            {data.valorMensal != null ? ` — R$ ${data.valorMensal.toFixed(0)}/mês` : ''}
          </span>
        )}
        {data.limiteUnidades != null && (
          <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-emerald-200">
            Até {data.limiteUnidades} unidade(s)
          </span>
        )}
      </div>
      {data.featuresLabels.length > 0 && (
        <p className="mt-3 text-xs text-emerald-950">
          <span className="font-medium">Ativos:</span> {data.featuresLabels.join(' · ')}
        </p>
      )}
      {data.bloqueadasLabels.length > 0 && (
        <p className="mt-1 text-xs text-emerald-800/70">
          <span className="font-medium">Upgrade:</span> {data.bloqueadasLabels.join(' · ')}
        </p>
      )}
    </div>
  );
}
