'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Layers, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import type { RegiaoOfertaModo } from '@/lib/oferta-agregada/types';

interface Props {
  mercadoId?: string;
}

type CestaItem = {
  chave: string;
  nomeRegional: string;
  demandaRegional: { usuariosUnicos: number; sinais: number; pressao: string };
  produtoNome: string | null;
  preco: number | null;
  emEstoque: boolean;
  motivoMatch: string;
};

type Payload = {
  config: {
    ativo: boolean;
    regiaoModo: RegiaoOfertaModo;
    diasJanela: number;
    regiaoModoLabel: string;
    aceiteEm?: string;
  };
  cesta: {
    regiaoDescricao: string;
    mercadosNaRegiao: number;
    consumidoresUnicos: number;
    totalSinais: number;
    explicacao: string;
    itens: CestaItem[];
  };
};

export function OfertaAgregadaGestorCard({ mercadoId }: Props) {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [aceitando, setAceitando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [data, setData] = useState<Payload | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    const q = new URLSearchParams();
    if (mercadoId) q.set('mercadoId', mercadoId);
    try {
      const res = await fetch(`/api/gestor/oferta-agregada?${q}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else {
        setErro(json.error ?? 'Erro ao carregar oferta agregada');
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

  const toggleAtivo = async (ativo: boolean) => {
    if (!data) return;
    setSalvando(true);
    setMsg(null);
    try {
      const res = await fetch('/api/gestor/oferta-agregada', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mercadoId, ativo }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg(ativo ? 'Oferta agregada ativada.' : 'Oferta agregada desativada.');
        await carregar();
      } else setErro(json.error ?? 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const aceitarCesta = async () => {
    setAceitando(true);
    setMsg(null);
    try {
      const res = await fetch('/api/gestor/oferta-agregada/aceitar', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mercadoId }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg(json.data?.mensagem ?? 'Cesta aceita.');
        await carregar();
      } else setErro(json.error ?? 'Erro ao aceitar');
    } finally {
      setAceitando(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando oferta agregada…
      </div>
    );
  }

  if (erro && !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {erro}
        <button type="button" onClick={() => void carregar()} className="ml-2 underline font-semibold">
          Tentar de novo
        </button>
      </div>
    );
  }

  if (!data) return null;

  const comEstoque = data.cesta.itens.filter((i) => i.emEstoque);

  return (
    <div className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/90 to-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-teal-800" />
          <h3 className="font-semibold text-teal-950">Oferta agregada da região (Épico 13)</h3>
        </div>
        <button
          type="button"
          onClick={() => void carregar()}
          className="rounded-lg p-1.5 text-teal-800 hover:bg-teal-100"
          aria-label="Atualizar"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-1 text-xs text-teal-900/75">{data.cesta.explicacao}</p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-teal-950">
          <input
            type="checkbox"
            checked={data.config.ativo}
            disabled={salvando}
            onChange={(e) => void toggleAtivo(e.target.checked)}
            className="rounded border-teal-300 text-teal-700"
          />
          Aceitar demanda agregada do bairro
        </label>
        <span className="text-xs text-teal-800/70">
          {data.cesta.regiaoDescricao} · {data.cesta.mercadosNaRegiao} mercados ·{' '}
          {data.cesta.consumidoresUnicos} consumidor(es)
        </span>
      </div>

      {msg && <p className="mt-2 text-xs font-medium text-teal-800">{msg}</p>}

      <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-xs">
        {data.cesta.itens.slice(0, 10).map((item) => (
          <li
            key={item.chave}
            className={`flex flex-wrap items-baseline justify-between gap-2 rounded-lg px-2 py-1 ${
              item.emEstoque ? 'bg-white/80 ring-1 ring-teal-100' : 'bg-gray-50 text-gray-500'
            }`}
          >
            <span className="font-medium text-gray-900">
              {item.produtoNome ?? item.nomeRegional}
              {!item.emEstoque && ' (sem estoque)'}
            </span>
            <span className="text-gray-600">
              {item.demandaRegional.sinais} sinais · {item.demandaRegional.usuariosUnicos} pessoas
              {item.preco != null && ` · R$ ${item.preco.toFixed(2)}`}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={aceitando || comEstoque.length === 0}
          onClick={() => void aceitarCesta()}
          className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {aceitando ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Aceitar cesta ({comEstoque.length} itens)
        </button>
        <Link
          href={`/gestor/produtos?mercadoId=${mercadoId ?? ''}`}
          className="rounded-lg border border-teal-300 px-3 py-2 text-xs font-semibold text-teal-900 hover:bg-teal-50"
        >
          Ajustar catálogo
        </Link>
      </div>

      {data.config.aceiteEm && (
        <p className="mt-2 text-[10px] text-teal-800/60">
          Último aceite: {new Date(data.config.aceiteEm).toLocaleString('pt-BR')}
        </p>
      )}
    </div>
  );
}
