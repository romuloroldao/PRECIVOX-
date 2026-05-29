'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Loader2, Sparkles } from 'lucide-react';

interface Props {
  mercadoId?: string;
  compact?: boolean;
}

type Acao = {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: 'alta' | 'media' | 'baixa';
  categoria: string;
  linkHref?: string;
  fontes?: string[];
};

const PRIORIDADE_DOT = {
  alta: 'bg-red-500',
  media: 'bg-amber-500',
  baixa: 'bg-slate-400',
};

export function ResumoSemanaGroocCard({ mercadoId, compact = true }: Props) {
  const [acoes, setAcoes] = useState<Acao[]>([]);
  const [narrativa, setNarrativa] = useState('');
  const [fontesResumo, setFontesResumo] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!mercadoId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      const q = new URLSearchParams({ dias: '7', regiaoPreco: 'cidade' });
      const res = await fetch(`/api/gestor/ia/resumo-semana/${mercadoId}?${q}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Erro ao carregar');
      setAcoes(json.acoes ?? []);
      setNarrativa(json.narrativa ?? '');
      setFontesResumo(json.fontesResumo ?? []);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro de rede');
    } finally {
      setLoading(false);
    }
  }, [mercadoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (!mercadoId) return null;

  if (loading && acoes.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        GROOC montando resumo da semana…
      </div>
    );
  }

  const top = acoes.slice(0, compact ? 3 : 6);

  return (
    <div className="rounded-xl border border-amber-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Resumo da semana · GROOC</h3>
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              Prioridades dos últimos 7 dias
            </p>
          </div>
        </div>
        <Link
          href="/gestor/ia/resumo"
          className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline shrink-0"
        >
          Ver tudo
        </Link>
      </div>

      <div className="p-4 space-y-3">
        {erro && <p className="text-sm text-red-700">{erro}</p>}

        {narrativa && (
          <p className="text-sm text-emerald-900 bg-emerald-50/80 rounded-lg p-3 border border-emerald-100 leading-relaxed">
            {narrativa}
          </p>
        )}

        {top.length === 0 && !erro && (
          <p className="text-sm text-gray-600">
            Poucos sinais ainda — com uso do app (busca, lista, NPS) as ações aparecem aqui.
          </p>
        )}

        <ul className="space-y-2">
          {top.map((a) => (
            <li key={a.id} className="flex gap-2 text-sm">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PRIORIDADE_DOT[a.prioridade]}`}
                title={`Prioridade ${a.prioridade}`}
              />
              <div className="min-w-0 flex-1">
                {a.linkHref ? (
                  <Link href={a.linkHref} className="font-medium text-gray-900 hover:text-amber-800">
                    {a.titulo}
                  </Link>
                ) : (
                  <p className="font-medium text-gray-900">{a.titulo}</p>
                )}
                {!compact && (
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{a.descricao}</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {fontesResumo.length > 0 && (
          <p className="text-xs text-gray-500 border-t border-gray-100 pt-2">
            Fontes: {fontesResumo.slice(0, 4).join(' · ')}
            {fontesResumo.length > 4 && ` +${fontesResumo.length - 4}`}
          </p>
        )}
      </div>
    </div>
  );
}
