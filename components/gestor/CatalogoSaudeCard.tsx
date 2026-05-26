'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Upload, RefreshCw } from 'lucide-react';
import type { CatalogoSaude } from '@/lib/catalogo-saude';

interface CatalogoSaudeCardProps {
  mercadoId?: string;
  className?: string;
}

export function CatalogoSaudeCard({ mercadoId, className = '' }: CatalogoSaudeCardProps) {
  const [data, setData] = useState<CatalogoSaude | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = mercadoId ? `?mercadoId=${encodeURIComponent(mercadoId)}` : '';
      const res = await fetch(`/api/gestor/catalogo-saude${q}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Falha ao carregar');
      }
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [mercadoId]);

  if (loading) {
    return (
      <div className={`rounded-xl border border-gray-200 bg-white p-4 ${className}`}>
        <p className="text-sm text-gray-500">Carregando saúde do catálogo…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`rounded-xl border border-red-100 bg-red-50 p-4 ${className}`}>
        <p className="text-sm text-red-800">{error ?? 'Dados indisponíveis'}</p>
        <button type="button" onClick={() => void load()} className="mt-2 text-xs font-medium text-red-700 underline">
          Tentar de novo
        </button>
      </div>
    );
  }

  const alerta = data.pctStale >= 15 || data.totalSkus === 0;
  const Icon = alerta ? AlertTriangle : CheckCircle2;

  return (
    <div
      className={`rounded-xl border p-4 ${
        alerta ? 'border-amber-200 bg-amber-50/50' : 'border-emerald-200 bg-emerald-50/30'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${alerta ? 'text-amber-600' : 'text-emerald-600'}`} />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Saúde do catálogo</h3>
            <p className="mt-1 text-xs text-gray-600">{data.recomendacao}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-white/80"
          aria-label="Atualizar"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-gray-500">SKUs ativos</dt>
          <dd className="font-semibold text-gray-900">{data.totalSkus}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Sem atualizar 7d+</dt>
          <dd className={`font-semibold ${data.skusStale > 0 ? 'text-amber-800' : 'text-gray-900'}`}>
            {data.skusStale} ({data.pctStale}%)
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Confiança média</dt>
          <dd className="font-semibold text-gray-900">
            {data.confiancaMedia != null ? `${data.confiancaMedia}%` : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Último import</dt>
          <dd className="font-semibold text-gray-900 truncate" title={data.ultimoImport?.nomeArquivo}>
            {data.ultimoImport
              ? new Date(data.ultimoImport.dataInicio).toLocaleDateString('pt-BR')
              : 'Nunca'}
          </dd>
        </div>
      </dl>

      {data.ultimoImport && (
        <p className="mt-2 text-[11px] text-gray-500">
          {data.ultimoImport.nomeArquivo} · {data.ultimoImport.status} · {data.ultimoImport.linhasSucesso} ok
          {data.ultimoImport.linhasErro > 0 ? ` · ${data.ultimoImport.linhasErro} erros` : ''}
        </p>
      )}

      <Link
        href="/gestor/produtos"
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-precivox-blue hover:underline"
      >
        <Upload className="h-3.5 w-3.5" />
        Atualizar catálogo
      </Link>
    </div>
  );
}
