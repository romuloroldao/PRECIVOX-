'use client';

import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { ClientePage } from '@/components/cliente/ClientePage';
import { ContribuidorBadge } from '@/components/cliente/ContribuidorBadge';
import { RelatorioSemanaCard } from '@/components/cliente/RelatorioSemanaCard';
import { MlLeveClienteCard } from '@/components/cliente/MlLeveClienteCard';
import {
  ElConfigPreferenciasCard,
  EL_PREFERENCIAS_PADRAO,
} from '@/components/cliente/ElConfigPreferenciasCard';
import type { EixoPreci, PerfilPreciScores } from '@/lib/perfil-preci';
import type { ElPreferenciasUsuario } from '@/lib/el-config-preferencias';
import type { ElConfigUsuario } from '@/lib/el-config-usuario';
import { useSession } from '@/lib/hooks/useUnifiedSession';
import { CASA } from '@/lib/ux-copy-casa';
import { UX } from '@/lib/ux-copy';
import { PreciPorQueEspelho } from '@/components/cliente/PreciPorQueEspelho';

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
  elConfig: ElConfigUsuario;
  elPreferencias: ElPreferenciasUsuario;
  elDefaults: ElConfigUsuario;
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
  const [elPreferencias, setElPreferencias] = useState<ElPreferenciasUsuario>(EL_PREFERENCIAS_PADRAO);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msgPerfil, setMsgPerfil] = useState<string | null>(null);
  const [msgErroPerfil, setMsgErroPerfil] = useState(false);
  const [mercadoId, setMercadoId] = useState<string | null>(null);

  const carregar = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
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
        if (pJson.data.elPreferencias) setElPreferencias(pJson.data.elPreferencias);
      } else if (pRes.status === 401) {
        setMsgErroPerfil(true);
        setMsgPerfil('Faça login para ver e editar seu perfil.');
      } else if (!opts?.silent) {
        setMsgErroPerfil(true);
        setMsgPerfil(pJson.error || 'Não foi possível carregar seu perfil.');
      }
      if (iJson.success && iJson.data) {
        setIntent({
          ...iJson.data,
          fatores: Array.isArray(iJson.data.fatores) ? iJson.data.fatores : [],
        });
      }
      try {
        const mRes = await fetch('/api/nps/suggest-mercado', { cache: 'no-store' });
        const mJson = await mRes.json();
        if (mJson.mercadoId) setMercadoId(mJson.mercadoId);
      } catch {
        /* ignore */
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  const userId = session?.user?.id;

  useEffect(() => {
    if (userId) void carregar();
  }, [userId, carregar]);

  const salvarAjustesPerfil = async () => {
    if (!perfil) return;
    const ajustesParaSalvar = EIXOS.reduce((acc, eixo) => {
      const valor = ajustes[eixo] ?? perfil.scoresEfetivos[eixo];
      if (valor !== perfil.scores[eixo]) {
        acc[eixo] = valor;
      }
      return acc;
    }, {} as Partial<PerfilPreciScores>);

    if (Object.keys(ajustesParaSalvar).length === 0) {
      setMsgErroPerfil(false);
      setMsgPerfil('Nenhum eixo foi alterado em relação ao perfil calculado.');
      return;
    }

    setSalvando(true);
    setMsgPerfil(null);
    setMsgErroPerfil(false);
    try {
      const res = await fetch('/api/cliente/perfil-preci', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ajustes: ajustesParaSalvar }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          res.status === 401
            ? 'Sua sessão expirou. Entre novamente para salvar.'
            : json.error || 'Erro ao salvar'
        );
      }
      setMsgErroPerfil(false);
      setMsgPerfil('Preferências salvas!');
      await carregar({ silent: true });
    } catch (e) {
      setMsgErroPerfil(true);
      setMsgPerfil(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const salvarElPreferencias = async (payload: {
    preferencias: ElPreferenciasUsuario;
    elConfig: ElConfigUsuario;
  }) => {
    const res = await fetch('/api/cliente/perfil-preci', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferencias: payload.preferencias,
        elConfig: payload.elConfig,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(
        res.status === 401
          ? 'Sua sessão expirou. Entre novamente para salvar.'
          : json.error || 'Erro ao salvar'
      );
    }
    setElPreferencias(payload.preferencias);
    await carregar({ silent: true });
  };

  const scoresExibidos = perfil
    ? EIXOS.reduce((acc, e) => {
        acc[e] = ajustes[e] ?? perfil.scoresEfetivos[e];
        return acc;
      }, {} as PerfilPreciScores)
    : null;

  return (
    <DashboardLayout role="CLIENTE">
      <ClientePage
        title={UX.perfil.titulo}
        description={UX.perfil.subtitulo}
        actions={<ContribuidorBadge />}
      >
      <div className="space-y-6">
        <Link
          href="/cliente/familia"
          className="inline-flex text-sm font-semibold text-indigo-700 hover:underline"
        >
          {CASA.perfilLink}
        </Link>

        {loading && !perfil && <p className="text-gray-500">Carregando…</p>}

        {!loading && !perfil && msgPerfil && (
          <p className={`text-sm ${msgErroPerfil ? 'text-red-600' : 'text-gray-600'}`}>{msgPerfil}</p>
        )}

        {perfil && scoresExibidos && (
          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div>
              <h2 className="font-semibold text-gray-900">{UX.perfil.eixosTitulo}</h2>
              <p className="mt-1 text-xs text-gray-500">{UX.perfil.eixosDica}</p>
            </div>
            <p className="text-xs text-gray-500">
              Confiança: {perfil.confianca}% · {perfil.reputacaoCrowd.confirmacoes}{' '}
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
                  value={ajustes[eixo] ?? perfil.scoresEfetivos[eixo]}
                  onChange={(ev) =>
                    setAjustes((prev) => ({ ...prev, [eixo]: parseInt(ev.target.value, 10) }))
                  }
                  className="mt-1 h-2 w-full cursor-pointer accent-emerald-600"
                  aria-label={`Ajustar ${perfil.eixoLabels[eixo]}`}
                />
              </div>
            ))}

            <PreciPorQueEspelho
              linhas={EIXOS.map((e) => `${perfil.eixoLabels[e]}: ${perfil.explicacoes[e]}`)}
            />

            <button
              type="button"
              disabled={salvando}
              onClick={() => void salvarAjustesPerfil()}
              className="w-full rounded-xl bg-precivox-blue py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {salvando ? 'Salvando…' : UX.perfil.salvar}
            </button>
            {msgPerfil && (
              <p className={`text-center text-sm ${msgErroPerfil ? 'text-red-600' : 'text-emerald-700'}`}>
                {msgPerfil}
              </p>
            )}
          </div>
        )}

        {mercadoId && <RelatorioSemanaCard mercadoId={mercadoId} />}
        {mercadoId && <MlLeveClienteCard mercadoId={mercadoId} />}

        {intent && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm font-medium text-slate-800">
              {UX.perfil.intentTitulo}
              {intent.proximaCompraEstimada ? ` · ${intent.proximaCompraEstimada}` : ''}
            </p>
            <p className="mt-1 text-sm text-slate-600">{intent.mensagem}</p>
            {intent.fatores && intent.fatores.length > 0 && (
              <PreciPorQueEspelho className="mt-2" linhas={intent.fatores} />
            )}
          </div>
        )}

        {perfil && (
          <ElConfigPreferenciasCard
            preferenciasIniciais={elPreferencias}
            onSalvar={salvarElPreferencias}
          />
        )}
      </div>
      </ClientePage>
    </DashboardLayout>
  );
}
