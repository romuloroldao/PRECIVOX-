'use client';

import { useCallback, useEffect, useState } from 'react';
import { Brain, Loader2, TrendingDown, Activity } from 'lucide-react';

type MlInsightsData = {
  fonte: 'batch' | 'tempo_real';
  churn: {
    score: number;
    nivel: 'baixo' | 'medio' | 'alto';
    diasSemAtividade: number;
    explicacao: string;
  };
  elasticidade: {
    coeficiente: number;
    rotulo: 'sensivel' | 'moderado' | 'pouco_sensivel';
    explicacao: string;
  };
  atualizadoEm: string;
};

interface Props {
  mercadoId: string;
}

const NIVEL_LABEL: Record<MlInsightsData['churn']['nivel'], string> = {
  baixo: 'Engajado',
  medio: 'Atenção',
  alto: 'Reativar',
};

const NIVEL_STYLE: Record<MlInsightsData['churn']['nivel'], string> = {
  baixo: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  medio: 'bg-amber-100 text-amber-900 ring-amber-200',
  alto: 'bg-red-100 text-red-900 ring-red-200',
};

const ELASTIC_LABEL: Record<MlInsightsData['elasticidade']['rotulo'], string> = {
  sensivel: 'Sensível a preço',
  moderado: 'Equilibrado',
  pouco_sensivel: 'Menos sensível',
};

export function MlLeveClienteCard({ mercadoId }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MlInsightsData | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ mercadoId });
      const res = await fetch(`/api/cliente/ml-insights?${q}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setData(null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [mercadoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm text-indigo-900">
        <Loader2 className="h-4 w-4 animate-spin" />
        Analisando seu padrão de compra (ML leve)…
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-indigo-950">
        <Brain className="h-5 w-5 text-indigo-700" />
        <h2 className="font-semibold">Seu padrão PRECI (ML leve)</h2>
      </div>
      <p className="mt-1 text-xs text-indigo-900/70">
        Heurísticas explicáveis sobre retenção e sensibilidade a preço — sem caixa-preta.
        {data.fonte === 'batch' ? ' Atualizado pelo job diário.' : ' Calculado agora com seu histórico.'}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-white/90 p-3 ring-1 ring-indigo-100">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-xs font-medium uppercase text-gray-500">
              <Activity className="h-3.5 w-3.5" />
              Retenção
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${NIVEL_STYLE[data.churn.nivel]}`}
            >
              {NIVEL_LABEL[data.churn.nivel]}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900">{data.churn.score}/100</p>
          <p className="mt-1 text-xs leading-snug text-gray-600">{data.churn.explicacao}</p>
        </div>

        <div className="rounded-lg bg-white/90 p-3 ring-1 ring-indigo-100">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-xs font-medium uppercase text-gray-500">
              <TrendingDown className="h-3.5 w-3.5" />
              Preço
            </span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-900">
              {ELASTIC_LABEL[data.elasticidade.rotulo]}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900">
            {data.elasticidade.coeficiente}
          </p>
          <p className="mt-1 text-xs leading-snug text-gray-600">{data.elasticidade.explicacao}</p>
        </div>
      </div>
    </div>
  );
}
