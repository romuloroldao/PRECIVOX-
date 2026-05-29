'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileCheck, Loader2, Shield } from 'lucide-react';

type TierInfo = {
  tier: 1 | 2 | 3;
  nome: string;
  descricao: string;
  cadencia: string;
  diasStaleMax: number;
  requisitos: string[];
};

type SlaData = {
  tier: 1 | 2 | 3;
  tierInfo: TierInfo;
  contrato: { versao: string; aceitoEm: string; aceitoPorNome?: string } | null;
  contratoVigente: boolean;
  avisoSync: string | null;
  tiers: TierInfo[];
  contratoVersaoAtual: string;
  contratoResumoHtml: string;
};

interface Props {
  mercadoId: string;
}

export function ParceiroSlaCard({ mercadoId }: Props) {
  const [data, setData] = useState<SlaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [tierDraft, setTierDraft] = useState<1 | 2 | 3>(1);
  const [aceite, setAceite] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gestor/parceiro-sla?mercadoId=${mercadoId}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setTierDraft(json.data.tier);
      }
    } finally {
      setLoading(false);
    }
  }, [mercadoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const aceitarContrato = async () => {
    if (!aceite) {
      setMsg('Marque que leu e aceita o contrato.');
      return;
    }
    setSalvando(true);
    setMsg(null);
    try {
      const res = await fetch('/api/gestor/parceiro-sla', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mercadoId, aceitarContrato: true }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg('Contrato aceito.');
        await carregar();
      } else {
        setMsg(json.error ?? 'Erro ao aceitar');
      }
    } catch {
      setMsg('Erro de rede');
    } finally {
      setSalvando(false);
    }
  };

  const salvarTier = async () => {
    setSalvando(true);
    setMsg(null);
    try {
      const res = await fetch('/api/gestor/parceiro-sla', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mercadoId, tier: tierDraft }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg(`Tier ${tierDraft} salvo.`);
        await carregar();
      } else {
        setMsg(json.error ?? 'Erro ao salvar tier');
      }
    } catch {
      setMsg('Erro de rede');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border bg-white p-6 text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando SLA do parceiro…
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-xl border border-indigo-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Shield className="h-5 w-5 text-indigo-600" />
            SLA e contrato de dados
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Tier atual: <strong>{data.tierInfo.nome}</strong> — {data.tierInfo.cadencia}
          </p>
        </div>
        {data.contratoVigente ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
            <FileCheck className="h-3.5 w-3.5" />
            Contrato v{data.contratoVersaoAtual} aceito
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200">
            Contrato pendente
          </span>
        )}
      </div>

      {data.avisoSync && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{data.avisoSync}</p>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Tier do parceiro</label>
          <select
            value={tierDraft}
            onChange={(e) => setTierDraft(Number(e.target.value) as 1 | 2 | 3)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {data.tiers.map((t) => (
              <option key={t.tier} value={t.tier}>
                Tier {t.tier} — {t.nome}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500">{data.tiers.find((t) => t.tier === tierDraft)?.descricao}</p>
          <ul className="mt-2 list-inside list-disc text-xs text-gray-600">
            {data.tiers
              .find((t) => t.tier === tierDraft)
              ?.requisitos.map((r) => (
                <li key={r}>{r}</li>
              ))}
          </ul>
          <button
            type="button"
            onClick={() => void salvarTier()}
            disabled={salvando || tierDraft === data.tier}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {salvando ? 'Salvando…' : 'Salvar tier'}
          </button>
        </div>

        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Contrato de dados (resumo)</h3>
          <div
            className="prose prose-sm mt-2 max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: data.contratoResumoHtml }}
          />
          {!data.contratoVigente && (
            <div className="mt-3 space-y-2">
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={aceite}
                  onChange={(e) => setAceite(e.target.checked)}
                  className="mt-1"
                />
                Li e aceito o contrato de dados na versão {data.contratoVersaoAtual}, em nome do mercado.
              </label>
              <button
                type="button"
                onClick={() => void aceitarContrato()}
                disabled={salvando}
                className="rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
              >
                Aceitar contrato
              </button>
            </div>
          )}
          {data.contrato && (
            <p className="mt-2 text-xs text-gray-500">
              Aceito em {new Date(data.contrato.aceitoEm).toLocaleString('pt-BR')}
              {data.contrato.aceitoPorNome ? ` por ${data.contrato.aceitoPorNome}` : ''}
            </p>
          )}
        </div>
      </div>

      {msg && <p className="mt-3 text-sm text-gray-700">{msg}</p>}
    </div>
  );
}
