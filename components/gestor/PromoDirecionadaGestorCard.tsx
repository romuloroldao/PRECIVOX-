'use client';

import { useCallback, useEffect, useState } from 'react';
import { Megaphone, Plus, RefreshCw } from 'lucide-react';

interface Props {
  mercadoId?: string;
}

type Promo = {
  id: string;
  titulo: string;
  descontoPct: number;
  segmentoLabel: string;
  ativo: boolean;
  validoAte: string;
};

export function PromoDirecionadaGestorCard({ mercadoId }: Props) {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [temFeature, setTemFeature] = useState(true);
  const [explicacao, setExplicacao] = useState('');
  const [loading, setLoading] = useState(true);
  const [criando, setCriando] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [desconto, setDesconto] = useState(10);

  const carregar = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (mercadoId) q.set('mercadoId', mercadoId);
    try {
      const res = await fetch(`/api/gestor/monetizacao/promo-direcionada?${q}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success) {
        setPromos(json.data.promos ?? []);
        setTemFeature(json.data.temFeature ?? true);
        setExplicacao(json.data.explicacao ?? '');
      }
    } finally {
      setLoading(false);
    }
  }, [mercadoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const criar = async () => {
    if (!titulo.trim()) return;
    setCriando(true);
    const validoAte = new Date();
    validoAte.setDate(validoAte.getDate() + 7);
    try {
      const res = await fetch('/api/gestor/monetizacao/promo-direcionada', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mercadoId,
          titulo: titulo.trim(),
          descontoPct: desconto,
          segmento: 'intent_alta',
          validoAte: validoAte.toISOString(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTitulo('');
        await carregar();
      }
    } finally {
      setCriando(false);
    }
  };

  const toggle = async (promoId: string, ativo: boolean) => {
    await fetch('/api/gestor/monetizacao/promo-direcionada', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mercadoId, promoId, ativo }),
    });
    await carregar();
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
        Carregando promos direcionadas…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4">
      <div className="flex items-start justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-orange-950">
          <Megaphone className="h-4 w-4" />
          Promo direcionada
        </h3>
        <button type="button" onClick={() => void carregar()} className="p-1 text-orange-700">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 text-xs text-orange-900/80">{explicacao}</p>

      {temFeature && (
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título da promo"
            className="min-w-[140px] flex-1 rounded-lg border border-orange-200 px-2 py-1.5 text-xs"
          />
          <input
            type="number"
            min={3}
            max={50}
            value={desconto}
            onChange={(e) => setDesconto(Number(e.target.value))}
            className="w-16 rounded-lg border border-orange-200 px-2 py-1.5 text-xs"
            aria-label="Desconto %"
          />
          <button
            type="button"
            disabled={criando || !titulo.trim()}
            onClick={() => void criar()}
            className="inline-flex items-center gap-1 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Criar
          </button>
        </div>
      )}

      {promos.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-xs">
          {promos.slice(0, 5).map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg bg-white/80 px-2 py-1.5"
            >
              <span>
                {p.titulo} — {p.descontoPct}% · {p.segmentoLabel}
              </span>
              <button
                type="button"
                onClick={() => void toggle(p.id, !p.ativo)}
                className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                  p.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {p.ativo ? 'Ativa' : 'Pausada'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
