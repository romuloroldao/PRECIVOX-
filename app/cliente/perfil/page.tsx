'use client';

import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { ClientePage } from '@/components/cliente/ClientePage';
import { ContribuidorBadge } from '@/components/cliente/ContribuidorBadge';
import { RelatorioSemanaCard } from '@/components/cliente/RelatorioSemanaCard';
import { MlLeveClienteCard } from '@/components/cliente/MlLeveClienteCard';
import type { EixoPreci, PerfilPreciScores } from '@/lib/perfil-preci';
import { useSession } from '@/lib/hooks/useUnifiedSession';
import { Sparkles, Clock } from 'lucide-react';
import { EL_CONFIG_LIMITS, labelFaixaValorHora, type ElConfigUsuario } from '@/lib/el-config-usuario';

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
  const [elConfig, setElConfig] = useState<ElConfigUsuario>({ valorHoraReais: 20, custoKmReais: 0.8 });
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msgPerfil, setMsgPerfil] = useState<string | null>(null);
  const [msgEl, setMsgEl] = useState<string | null>(null);
  const [msgErroPerfil, setMsgErroPerfil] = useState(false);
  const [msgErroEl, setMsgErroEl] = useState(false);
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
        if (pJson.data.elConfig) setElConfig(pJson.data.elConfig);
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

  const salvarElConfig = async () => {
    setSalvando(true);
    setMsgEl(null);
    setMsgErroEl(false);
    try {
      const res = await fetch('/api/cliente/perfil-preci', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elConfig }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          res.status === 401
            ? 'Sua sessão expirou. Entre novamente para salvar.'
            : json.error || 'Erro ao salvar'
        );
      }
      setMsgErroEl(false);
      setMsgEl('Preferências de EL salvas!');
      await carregar({ silent: true });
    } catch (e) {
      setMsgErroEl(true);
      setMsgEl(e instanceof Error ? e.message : 'Erro ao salvar');
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
      <ClientePage
        title="Seu Perfil PRECI"
        description="Espelho do seu jeito de comprar — calculado pelo app, ajustável por você."
        actions={<ContribuidorBadge />}
      >
      <div className="space-y-6">
        <Link
          href="/cliente/familia"
          className="inline-flex text-sm font-semibold text-indigo-700 hover:underline"
        >
          Raio familiar — listas e preferências da casa →
        </Link>

        {loading && !perfil && <p className="text-gray-500">Carregando…</p>}

        {!loading && !perfil && msgPerfil && (
          <p className={`text-sm ${msgErroPerfil ? 'text-red-600' : 'text-gray-600'}`}>{msgPerfil}</p>
        )}

        {perfil && scoresExibidos && (
          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div>
              <h2 className="font-semibold text-gray-900">Ajuste como quer ser tratado</h2>
              <p className="mt-1 text-xs text-gray-500">
                Arraste cada eixo e toque em salvar. Valores calculados pelo app ficam como referência.
              </p>
            </div>
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
                  value={ajustes[eixo] ?? perfil.scoresEfetivos[eixo]}
                  onChange={(ev) =>
                    setAjustes((prev) => ({ ...prev, [eixo]: parseInt(ev.target.value, 10) }))
                  }
                  className="mt-1 h-2 w-full cursor-pointer accent-emerald-600"
                  aria-label={`Ajustar ${perfil.eixoLabels[eixo]}`}
                />
                <p className="mt-1 text-xs text-gray-500">{perfil.explicacoes[eixo]}</p>
              </div>
            ))}

            <button
              type="button"
              disabled={salvando}
              onClick={() => void salvarAjustesPerfil()}
              className="w-full rounded-xl bg-precivox-blue py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {salvando ? 'Salvando…' : 'Salvar como quero ser tratado'}
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
          <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
            <div className="flex items-center gap-2 text-violet-900">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">Intenção de compra: {intent.score}/100</span>
            </div>
            <p className="mt-2 text-sm text-violet-800">{intent.mensagem}</p>
            {intent.fatores && intent.fatores.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-xs text-violet-700">
                {intent.fatores.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {perfil && (
          <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-900">
              <Clock className="h-5 w-5" />
              <h2 className="font-semibold">Economia Líquida — valor do seu tempo</h2>
            </div>
            <p className="text-xs text-emerald-800/80">
              Usamos isso para calcular se vale a pena ir a outra loja. Padrão do app: R${' '}
              {perfil.elDefaults.valorHoraReais}/h e R$ {perfil.elDefaults.custoKmReais}/km.
            </p>

            <div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-800">Quanto vale sua hora?</span>
                <span className="tabular-nums text-gray-600">R$ {elConfig.valorHoraReais}/h</span>
              </div>
              <input
                type="range"
                min={EL_CONFIG_LIMITS.valorHoraMin}
                max={EL_CONFIG_LIMITS.valorHoraMax}
                step={1}
                value={elConfig.valorHoraReais}
                onChange={(ev) =>
                  setElConfig((prev) => ({
                    ...prev,
                    valorHoraReais: parseInt(ev.target.value, 10),
                  }))
                }
                className="mt-1 h-2 w-full cursor-pointer accent-emerald-600"
              />
              <p className="mt-1 text-xs text-emerald-700">{labelFaixaValorHora(elConfig.valorHoraReais)}</p>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-800">Custo por km (combustível + desgaste)</span>
                <span className="tabular-nums text-gray-600">R$ {elConfig.custoKmReais.toFixed(2)}/km</span>
              </div>
              <input
                type="range"
                min={EL_CONFIG_LIMITS.custoKmMin * 10}
                max={EL_CONFIG_LIMITS.custoKmMax * 10}
                step={1}
                value={Math.round(elConfig.custoKmReais * 10)}
                onChange={(ev) =>
                  setElConfig((prev) => ({
                    ...prev,
                    custoKmReais: parseInt(ev.target.value, 10) / 10,
                  }))
                }
                className="mt-1 h-2 w-full cursor-pointer accent-emerald-600"
              />
            </div>

            <button
              type="button"
              disabled={salvando}
              onClick={() => void salvarElConfig()}
              className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {salvando ? 'Salvando…' : 'Salvar preferências de EL'}
            </button>
            {msgEl && (
              <p className={`text-center text-sm ${msgErroEl ? 'text-red-600' : 'text-emerald-700'}`}>
                {msgEl}
              </p>
            )}
          </div>
        )}
      </div>
      </ClientePage>
    </DashboardLayout>
  );
}
