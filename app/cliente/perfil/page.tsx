'use client';

import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ContribuidorBadge } from '@/components/cliente/ContribuidorBadge';
import type { EixoPreci, PerfilPreciScores } from '@/lib/perfil-preci';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';

type PerfilData = {
  scores: PerfilPreciScores;
  scoresEfetivos: PerfilPreciScores;
  ajustesUsuario: Partial<PerfilPreciScores> | null;
  explicacoes: Record<EixoPreci, string>;
  confianca: number;
  eixoLabels: Record<EixoPreci, string>;
  reputacaoCrowd: {
    nivel: string;
    label: string;
    confirmacoes: number;
    proximoNivelEm: number | null;
  };
};

type IntentData = {
  score: number;
  mensagem: string;
  fatores: string[];
  proximaCompraEstimada?: string;
};

const EIXOS: EixoPreci[] = ['planejador', 'marca', 'conveniencia', 'explorador', 'urgente'];

export default function PerfilPreciPage() {
  const { data: session } = useSession();
  const [perfil, setPerfil] = useState<PerfilData | null>(null);
  const [intent, setIntent] = useState<IntentData | null>(null);
  const [ajustes, setAjustes] = useState<Partial<PerfilPreciScores>>({});
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, iRes] = await Promise.all([
        fetch('/api/cliente/perfil-preci', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/cliente/intent-score', { credentials: 'include', cache: 'no-store' }),
      ]);
      const pJson = await pRes.json();
      const iJson = await iRes.json();
      if (pJson.success) {
        setPerfil(pJson.data);
        setAjustes(pJson.data.ajustesUsuario ?? {});
      }
      if (iJson.success) setIntent(iJson.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) void carregar();
  }, [session, carregar]);

  const salvarAjustes = async () => {
    setSalvando(true);
    setMsg(null);
    try {
      const res = await fetch('/api/cliente/perfil-preci', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ajustes }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      setMsg('Preferências salvas!');
      await carregar();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const scoresExibidos = perfil
    ? EIXOS.reduce((acc, e) => {
        acc[e] = ajustes[e] ?? perfil.scoresEfetivos[e];
        return acc;
      }, {} as PerfilPreciScores)
    : null;

  return (
    <DashboardLayout role="CLIENTE">
      <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
        <Link
          href="/cliente/home"
          className="inline-flex items-center gap-1 text-sm font-medium text-precivox-blue hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Seu Perfil PRECI</h1>
          <ContribuidorBadge />
        </div>
        <p className="text-sm text-gray-600">
          Espelho do seu jeito de comprar — calculado pelo app, ajustável por você. Nada invasivo: só
          o que você faz no PRECIVOX.
        </p>

        {loading && <p className="text-gray-500">Carregando…</p>}

        {intent && (
          <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
            <div className="flex items-center gap-2 text-violet-900">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">Intenção de compra: {intent.score}/100</span>
            </div>
            <p className="mt-2 text-sm text-violet-800">{intent.mensagem}</p>
            {intent.fatores.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-xs text-violet-700">
                {intent.fatores.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {perfil && scoresExibidos && (
          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">
              Confiança do perfil: {perfil.confianca}% · {perfil.reputacaoCrowd.confirmacoes}{' '}
              preços confirmados
              {perfil.reputacaoCrowd.proximoNivelEm != null &&
                ` · faltam ${perfil.reputacaoCrowd.proximoNivelEm} para o próximo nível`}
            </p>

            {EIXOS.map((eixo) => (
              <div key={eixo}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-800">{perfil.eixoLabels[eixo]}</span>
                  <span className="tabular-nums text-gray-600">{scoresExibidos[eixo]}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={ajustes[eixo] ?? perfil.scores[eixo]}
                  onChange={(ev) =>
                    setAjustes((prev) => ({ ...prev, [eixo]: parseInt(ev.target.value, 10) }))
                  }
                  className="mt-1 h-2 w-full cursor-pointer accent-emerald-600"
                />
                <p className="mt-1 text-xs text-gray-500">{perfil.explicacoes[eixo]}</p>
              </div>
            ))}

            <button
              type="button"
              disabled={salvando}
              onClick={() => void salvarAjustes()}
              className="w-full rounded-xl bg-precivox-blue py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {salvando ? 'Salvando…' : 'Salvar como quero ser tratado'}
            </button>
            {msg && <p className="text-center text-sm text-emerald-700">{msg}</p>}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
