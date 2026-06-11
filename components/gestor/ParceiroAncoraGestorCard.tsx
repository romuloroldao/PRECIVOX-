'use client';

import { useCallback, useEffect, useState } from 'react';
import { Anchor, Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  mercadoId?: string;
}

type Parceiro = {
  mercadoId: string;
  nome: string;
  tipoLabel: string;
  selo: string | null;
  prioridade: number;
};

type Payload = {
  config: {
    ativo: boolean;
    tipo: string;
    regiaoModoLabel: string;
    prioridade: number;
    rotulo?: string;
    designadoEm?: string;
  };
  elegibilidade: { elegivel: boolean; tier: number; motivos: string[] };
  regiao: {
    regiaoDescricao: string;
    ancoraCount: number;
    metaMin: number;
    metaMax: number;
    regiaoCompleta: boolean;
    parceiros: Parceiro[];
  };
  eu: Parceiro | null;
  explicacao: string;
};

export function ParceiroAncoraGestorCard({ mercadoId }: Props) {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [data, setData] = useState<Payload | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    const q = new URLSearchParams();
    if (mercadoId) q.set('mercadoId', mercadoId);
    try {
      const res = await fetch(`/api/gestor/parceiros-ancora?${q}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else {
        setErro(json.error ?? 'Erro ao carregar parceiros âncora');
        setData(null);
      }
    } catch {
      setErro('Erro de rede');
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
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
        Carregando parceiros âncora…
      </div>
    );
  }

  if (erro || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {erro ?? 'Indisponível'}
      </div>
    );
  }

  const { config, elegibilidade, regiao, eu, explicacao } = data;

  return (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-indigo-950">
            <Anchor className="h-4 w-4 text-indigo-600" />
            Parceiro âncora — região piloto
          </h3>
          <p className="mt-1 text-xs text-indigo-900/75">{explicacao}</p>
        </div>
        <button
          type="button"
          onClick={() => void carregar()}
          className="rounded-lg p-1.5 text-indigo-700 hover:bg-indigo-100"
          aria-label="Atualizar"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {config.ativo ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-1 font-medium text-white">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Âncora ativa
          </span>
        ) : elegibilidade.elegivel ? (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-900">
            Elegível — aguardando designação PRECIVOX
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-900">
            <AlertCircle className="h-3.5 w-3.5" />
            Requisitos pendentes
          </span>
        )}
        <span className="rounded-full bg-white px-2.5 py-1 text-indigo-900 ring-1 ring-indigo-200">
          Região: {regiao.regiaoDescricao} ({config.regiaoModoLabel})
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 text-indigo-900 ring-1 ring-indigo-200">
          {regiao.ancoraCount}/{regiao.metaMax} âncoras
          {regiao.regiaoCompleta ? ' · piloto completo' : ` · meta ${regiao.metaMin}+`}
        </span>
      </div>

      {!config.ativo && !elegibilidade.elegivel && elegibilidade.motivos.length > 0 && (
        <ul className="mt-3 list-inside list-disc text-xs text-amber-900/90">
          {elegibilidade.motivos.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}

      {regiao.parceiros.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-indigo-950">Rede piloto na região</p>
          <ul className="mt-2 space-y-1.5">
            {regiao.parceiros.map((p) => (
              <li
                key={p.mercadoId}
                className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-xs ${
                  p.mercadoId === eu?.mercadoId
                    ? 'bg-indigo-100 font-medium text-indigo-950'
                    : 'bg-white/70 text-indigo-900'
                }`}
              >
                <span>
                  {p.nome}
                  {p.mercadoId === eu?.mercadoId ? ' (você)' : ''}
                </span>
                <span className="text-indigo-700/80">
                  {p.tipoLabel}
                  {p.selo ? ` · ${p.selo}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-[11px] leading-snug text-indigo-800/70">
        Parceiros âncora são 3–5 redes/atacados por região piloto (Tier 2+). Designação via time
        PRECIVOX.
      </p>
    </div>
  );
}
