'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2, RefreshCw, PackageX } from 'lucide-react';

interface Props {
  mercadoId?: string;
  compact?: boolean;
}

type Alerta = {
  id: string;
  produtoId: string;
  produtoNome: string;
  unidadeNome: string | null;
  quantidadeAtual: number;
  buscasRecentes: number;
  listasAtivas: number;
  confirmacoesCrowd: number;
  scoreRisco: number;
  prioridade: 'CRITICA' | 'ALTA' | 'MEDIA';
  motivo: string;
  acaoRecomendada: string;
};

const PRIORIDADE_STYLE: Record<Alerta['prioridade'], string> = {
  CRITICA: 'bg-red-100 text-red-800 border-red-200',
  ALTA: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIA: 'bg-amber-50 text-amber-800 border-amber-200',
};

export function RupturaPreditivaCard({ mercadoId, compact = false }: Props) {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [explicacao, setExplicacao] = useState('');
  const [totalCriticos, setTotalCriticos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    const q = new URLSearchParams({
      limite: compact ? '5' : '12',
      sync: '1',
    });
    if (mercadoId) q.set('mercadoId', mercadoId);
    try {
      const res = await fetch(`/api/gestor/ruptura-preditiva?${q}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success) {
        setAlertas(json.data.alertas ?? []);
        setExplicacao(json.data.explicacao ?? '');
        setTotalCriticos(json.data.totalCriticos ?? 0);
      } else {
        setErro(json.error ?? 'Erro ao carregar alertas');
      }
    } catch {
      setErro('Erro de rede');
    } finally {
      setLoading(false);
    }
  }, [mercadoId, compact]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (loading && alertas.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Analisando sinais de ruptura…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="flex items-center gap-2">
          <PackageX className="h-5 w-5 text-red-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Ruptura preditiva</h3>
            <p className="text-xs text-gray-600">
              Busca alta + crowd sem confirmação
              {totalCriticos > 0 && (
                <span className="ml-1 font-semibold text-red-700">
                  · {totalCriticos} crítico{totalCriticos > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void carregar()}
          className="p-1.5 rounded-lg hover:bg-white/80 text-gray-600"
          title="Atualizar"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {erro && (
          <p className="text-sm text-red-700">{erro}</p>
        )}

        {!erro && alertas.length === 0 && (
          <p className="text-sm text-gray-600">
            Nenhum risco preditivo detectado nos últimos 7 dias. Demanda e confirmações crowd estão alinhadas.
          </p>
        )}

        {alertas.map((a) => (
          <div
            key={a.id}
            className="rounded-lg border border-gray-100 p-3 hover:border-gray-200 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{a.produtoNome}</p>
                {a.unidadeNome && (
                  <p className="text-xs text-gray-500">{a.unidadeNome}</p>
                )}
              </div>
              <span
                className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${PRIORIDADE_STYLE[a.prioridade]}`}
              >
                {a.prioridade}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{a.motivo}</p>
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
              <span>Estoque: {a.quantidadeAtual}</span>
              <span>Buscas: {a.buscasRecentes}</span>
              <span>Listas: {a.listasAtivas}</span>
              <span>Crowd: {a.confirmacoesCrowd}</span>
              <span>Risco: {a.scoreRisco}%</span>
            </div>
            <p className="text-xs text-orange-800 mt-2 flex items-start gap-1">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {a.acaoRecomendada}
            </p>
          </div>
        ))}

        {explicacao && alertas.length > 0 && (
          <p className="text-xs text-gray-500 border-t border-gray-100 pt-3">{explicacao}</p>
        )}

        {!compact && alertas.length > 0 && (
          <Link
            href="/gestor/ia/compras"
            className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Ver painel de compras e reposição →
          </Link>
        )}
      </div>
    </div>
  );
}
