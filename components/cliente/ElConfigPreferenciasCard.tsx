'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import {
  EL_CONFIG_LIMITS,
  EL_PREFERENCIAS_PADRAO,
  EL_PRESSA_OPCOES,
  EL_PRIORIDADE_OPCOES,
  EL_TRANSPORTE_OPCOES,
  exemploValeDeslocamento,
  inferirPreferenciasDeConfig,
  preferenciasParaElConfig,
  resumoElPreferencias,
  type ElPreferenciasUsuario,
} from '@/lib/el-config-preferencias';
import { elConfigEfetivo, type ElConfigUsuario } from '@/lib/el-config-usuario';

function OpcaoGrupo<T extends string>({
  titulo,
  opcoes,
  valor,
  onChange,
}: {
  titulo: string;
  opcoes: { id: T; titulo: string; descricao: string }[];
  valor: T;
  onChange: (id: T) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-gray-800">{titulo}</legend>
      <div className="grid gap-2 sm:grid-cols-1">
        {opcoes.map((op) => {
          const ativo = valor === op.id;
          return (
            <button
              key={op.id}
              type="button"
              onClick={() => onChange(op.id)}
              className={`rounded-xl border px-3 py-2.5 text-left transition ${
                ativo
                  ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/30'
                  : 'border-gray-200 bg-white/80 hover:border-emerald-300'
              }`}
            >
              <span className="block text-sm font-semibold text-gray-900">{op.titulo}</span>
              <span className="mt-0.5 block text-xs text-gray-600">{op.descricao}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ElConfigPreferenciasCard({
  preferenciasIniciais,
  onSalvar,
}: {
  preferenciasIniciais: ElPreferenciasUsuario;
  onSalvar: (payload: {
    preferencias: ElPreferenciasUsuario;
    elConfig: ElConfigUsuario;
  }) => Promise<void>;
}) {
  const [pref, setPref] = useState<ElPreferenciasUsuario>(preferenciasIniciais);
  const [avancado, setAvancado] = useState(false);
  const [cfgManual, setCfgManual] = useState<ElConfigUsuario | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [salvandoLocal, setSalvandoLocal] = useState(false);

  useEffect(() => {
    setPref(preferenciasIniciais);
    setCfgManual(null);
  }, [preferenciasIniciais]);

  const cfg = useMemo(
    () => cfgManual ?? preferenciasParaElConfig(pref),
    [cfgManual, pref]
  );

  const resumo = useMemo(() => resumoElPreferencias(pref, cfg), [pref, cfg]);
  const exemplo = useMemo(() => exemploValeDeslocamento(cfg), [cfg]);

  const aoMudarPreferencia = (patch: Partial<ElPreferenciasUsuario>) => {
    setCfgManual(null);
    setPref((p) => ({ ...p, ...patch }));
  };

  const salvar = async () => {
    setMsg(null);
    setSalvandoLocal(true);
    const elConfig = elConfigEfetivo(cfg);
    const preferencias = cfgManual ? inferirPreferenciasDeConfig(elConfig) : pref;
    try {
      await onSalvar({ preferencias, elConfig });
      setPref(preferencias);
      setCfgManual(null);
      setMsg('Preferências salvas!');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSalvandoLocal(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-emerald-900">
        <Clock className="h-5 w-5" />
        <h2 className="font-semibold">Economia Líquida — seu jeito de ir ao mercado</h2>
      </div>
      <p className="text-xs leading-relaxed text-emerald-900/85">
        Responda em linguagem do dia a dia. O app traduz isso para saber se vale a pena ir a outra
        loja — você não precisa saber quanto ganha por hora nem custo de combustível.
      </p>

      <OpcaoGrupo
        titulo="Se outro mercado tiver preço melhor, você…"
        opcoes={EL_PRIORIDADE_OPCOES}
        valor={pref.prioridade}
        onChange={(prioridade) => aoMudarPreferencia({ prioridade })}
      />

      <OpcaoGrupo
        titulo="Como costuma ir às compras?"
        opcoes={EL_TRANSPORTE_OPCOES}
        valor={pref.transporte}
        onChange={(transporte) => aoMudarPreferencia({ transporte })}
      />

      <OpcaoGrupo
        titulo="No dia da compra, seu tempo costuma ser…"
        opcoes={EL_PRESSA_OPCOES}
        valor={pref.pressa}
        onChange={(pressa) => aoMudarPreferencia({ pressa })}
      />

      <div
        className={`rounded-lg px-3 py-2 text-xs ${
          exemplo.vale ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-50 text-amber-900'
        }`}
      >
        <p className="font-medium">{resumo}</p>
        <p className="mt-1 opacity-90">{exemplo.texto}</p>
      </div>

      <button
        type="button"
        disabled={salvandoLocal}
        onClick={() => void salvar()}
        className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {salvandoLocal ? 'Salvando…' : 'Salvar preferências de economia'}
      </button>

      <button
        type="button"
        onClick={() => setAvancado((v) => !v)}
        className="flex w-full items-center justify-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
      >
        {avancado ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {avancado ? 'Ocultar detalhes técnicos' : 'Ajuste fino (opcional)'}
      </button>

      {avancado && (
        <div className="space-y-3 rounded-lg border border-dashed border-gray-300 bg-white/60 p-3">
          <p className="text-[11px] text-gray-500">
            Valores usados internamente. A maioria das pessoas não precisa alterar.
          </p>
          <label className="block text-xs text-gray-700">
            Valor do tempo (R$/h): {cfg.valorHoraReais}
            <input
              type="range"
              min={EL_CONFIG_LIMITS.valorHoraMin}
              max={EL_CONFIG_LIMITS.valorHoraMax}
              value={cfg.valorHoraReais}
              onChange={(e) =>
                setCfgManual(
                  elConfigEfetivo({
                    ...cfg,
                    valorHoraReais: parseInt(e.target.value, 10),
                  })
                )
              }
              className="mt-1 h-2 w-full accent-emerald-600"
            />
          </label>
          <label className="block text-xs text-gray-700">
            Custo por km (R$): {cfg.custoKmReais.toFixed(2)}
            <input
              type="range"
              min={EL_CONFIG_LIMITS.custoKmMin * 10}
              max={EL_CONFIG_LIMITS.custoKmMax * 10}
              value={Math.round(cfg.custoKmReais * 10)}
              onChange={(e) =>
                setCfgManual(
                  elConfigEfetivo({
                    ...cfg,
                    custoKmReais: parseInt(e.target.value, 10) / 10,
                  })
                )
              }
              className="mt-1 h-2 w-full accent-emerald-600"
            />
          </label>
        </div>
      )}

      {msg && <p className="text-center text-sm text-emerald-700">{msg}</p>}
    </div>
  );
}

export { EL_PREFERENCIAS_PADRAO };
