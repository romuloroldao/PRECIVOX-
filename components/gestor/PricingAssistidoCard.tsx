'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, Sparkles, Tag } from 'lucide-react';

type Sugestao = {
  id: string;
  produtoNome: string;
  estoqueId: string;
  unidadeNome: string;
  precoAtual: number;
  precoPromocionalSugerido: number;
  descontoPct: number;
  duracaoDias: number;
  motivo: string;
  impactoEsperado: { aumentoVendas: number; impactoMargem: number };
  confianca: number;
  demandaBairro: boolean;
  jaEmPromocao: boolean;
};

interface Props {
  mercadoId?: string;
  compact?: boolean;
}

export function PricingAssistidoCard({ mercadoId, compact = false }: Props) {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [explicacao, setExplicacao] = useState('');
  const [loading, setLoading] = useState(true);
  const [aprovando, setAprovando] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    const q = new URLSearchParams({ limite: compact ? '4' : '8' });
    if (mercadoId) q.set('mercadoId', mercadoId);
    try {
      const res = await fetch(`/api/gestor/pricing-assistido?${q}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success) {
        setSugestoes(json.data.sugestoes ?? []);
        setExplicacao(json.data.explicacao ?? '');
      } else {
        setMsg(json.error ?? 'Erro ao carregar sugestões');
      }
    } catch {
      setMsg('Erro de rede');
    } finally {
      setLoading(false);
    }
  }, [mercadoId, compact]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const aprovar = async (s: Sugestao) => {
    if (s.jaEmPromocao) return;
    setAprovando(s.estoqueId);
    setMsg(null);
    try {
      const res = await fetch('/api/gestor/pricing-assistido/aprovar', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mercadoId,
          estoqueId: s.estoqueId,
          descontoPct: s.descontoPct,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg(
          `Promoção aplicada: ${json.data.produtoNome} — R$ ${json.data.precoPromocional.toFixed(2)} (-${json.data.descontoPct}%)`
        );
        setSugestoes((prev) => prev.filter((x) => x.estoqueId !== s.estoqueId));
      } else {
        setMsg(json.error ?? 'Falha ao aprovar');
      }
    } catch {
      setMsg('Erro de rede ao aprovar');
    } finally {
      setAprovando(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border bg-white p-4 text-sm text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando pricing assistido…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            Pricing assistido
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Promo engine + radar do bairro — aprove em 1 toque
          </p>
        </div>
        {!compact && (
          <Link
            href="/gestor/ia/promocoes"
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            Ver todas →
          </Link>
        )}
      </div>

      {explicacao && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{explicacao}</p>
      )}

      {sugestoes.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">Nenhuma sugestão no momento.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {sugestoes.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-gray-100 bg-gray-50/80 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">{s.produtoNome}</p>
                  <p className="text-xs text-gray-500">
                    {s.unidadeNome} · confiança {s.confianca}%
                    {s.demandaBairro && (
                      <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-violet-800">
                        demanda bairro
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-500 line-through">R$ {s.precoAtual.toFixed(2)}</p>
                  <p className="font-semibold text-emerald-700">
                    R$ {s.precoPromocionalSugerido.toFixed(2)}{' '}
                    <span className="text-xs">(-{s.descontoPct}%)</span>
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-600">{s.motivo}</p>
              <p className="mt-1 text-xs text-gray-500">
                Impacto estimado: +{s.impactoEsperado.aumentoVendas}% vendas · margem{' '}
                {s.impactoEsperado.impactoMargem}% · {s.duracaoDias} dias
              </p>
              <button
                type="button"
                disabled={s.jaEmPromocao || aprovando === s.estoqueId}
                onClick={() => void aprovar(s)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {aprovando === s.estoqueId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {s.jaEmPromocao ? 'Já em promoção' : 'Aprovar promoção (1 toque)'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {msg && (
        <p className="mt-3 flex items-center gap-1 text-sm text-gray-700">
          <Tag className="h-4 w-4 shrink-0 text-emerald-600" />
          {msg}
        </p>
      )}
    </div>
  );
}
