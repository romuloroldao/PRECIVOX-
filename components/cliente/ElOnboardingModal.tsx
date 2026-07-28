'use client';

import { useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  EL_PREFERENCIAS_PADRAO,
  EL_PRIORIDADE_OPCOES,
  EL_TRANSPORTE_OPCOES,
  exemploValeDeslocamento,
  preferenciasParaElConfig,
  type ElMeioTransporte,
  type ElPreferenciasUsuario,
  type ElPrioridadeDeslocamento,
} from '@/lib/el-config-preferencias';
import { elConfigEfetivo } from '@/lib/el-config-usuario';
import { MapPin } from 'lucide-react';

function OpcaoCard<T extends string>({
  opcoes,
  valor,
  onChange,
}: {
  opcoes: { id: T; titulo: string; descricao: string }[];
  valor: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="grid gap-2">
      {opcoes.map((op) => {
        const ativo = valor === op.id;
        return (
          <button
            key={op.id}
            type="button"
            onClick={() => onChange(op.id)}
            className={`rounded-xl border px-3 py-3 text-left transition ${
              ativo
                ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/30'
                : 'border-gray-200 bg-white hover:border-emerald-300'
            }`}
          >
            <span className="block text-sm font-semibold text-gray-900">{op.titulo}</span>
            <span className="mt-0.5 block text-xs text-gray-600">{op.descricao}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ElOnboardingModal({
  isOpen,
  onClose,
  onConcluir,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConcluir: (payload: {
    preferencias: ElPreferenciasUsuario;
    usarPadrao: boolean;
  }) => Promise<void>;
}) {
  const [passo, setPasso] = useState<1 | 2>(1);
  const [prioridade, setPrioridade] = useState(EL_PREFERENCIAS_PADRAO.prioridade);
  const [transporte, setTransporte] = useState(EL_PREFERENCIAS_PADRAO.transporte);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const preferencias = useMemo(
    (): ElPreferenciasUsuario => ({
      prioridade,
      transporte,
      pressa: 'normal',
    }),
    [prioridade, transporte]
  );

  const exemplo = useMemo(
    () => exemploValeDeslocamento(elConfigEfetivo(preferenciasParaElConfig(preferencias))),
    [preferencias]
  );

  const salvar = async (usarPadrao: boolean) => {
    setSalvando(true);
    setErro(null);
    try {
      await onConcluir({
        preferencias: usarPadrao ? EL_PREFERENCIAS_PADRAO : preferencias,
        usarPadrao,
      });
      setPasso(1);
      setPrioridade(EL_PREFERENCIAS_PADRAO.prioridade);
      setTransporte(EL_PREFERENCIAS_PADRAO.transporte);
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const handleDismiss = () => {
    setPasso(1);
    setPrioridade(EL_PREFERENCIAS_PADRAO.prioridade);
    setTransporte(EL_PREFERENCIAS_PADRAO.transporte);
    setErro(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      size="sm"
      showCloseButton={!salvando}
      title={passo === 1 ? 'Vale a pena ir a outro mercado?' : 'Como você costuma ir?'}
      description={
        passo === 1
          ? 'Duas perguntas rápidas — o app aprende seu jeito de decidir. Sem fórmulas.'
          : 'Usamos isso para estimar tempo e deslocamento nas recomendações.'
      }
      footer={
        passo === 1 ? (
          <>
            <Button variant="ghost" onClick={() => void salvar(true)} disabled={salvando}>
              Usar padrão do app
            </Button>
            <Button
              onClick={() => setPasso(2)}
              disabled={salvando}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Continuar
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setPasso(1)} disabled={salvando}>
              Voltar
            </Button>
            <Button
              onClick={() => void salvar(false)}
              disabled={salvando}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {salvando ? 'Salvando…' : 'Pronto'}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          <span>Passo {passo} de 2 · leva menos de 30 segundos</span>
        </div>

        {passo === 1 ? (
          <OpcaoCard<ElPrioridadeDeslocamento>
            opcoes={EL_PRIORIDADE_OPCOES}
            valor={prioridade}
            onChange={setPrioridade}
          />
        ) : (
          <>
            <OpcaoCard<ElMeioTransporte>
              opcoes={EL_TRANSPORTE_OPCOES}
              valor={transporte}
              onChange={setTransporte}
            />
            <div
              className={`rounded-lg px-3 py-2 text-xs ${
                exemplo.vale ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-50 text-amber-900'
              }`}
            >
              {exemplo.texto}
            </div>
          </>
        )}

        {erro && <p className="text-sm text-red-600">{erro}</p>}
      </div>
    </Modal>
  );
}
