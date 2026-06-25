'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { MercadoSelector } from '@/components/cliente/MercadoSelector';
import { ClientePage } from '@/components/cliente/ClientePage';
import { Loader2, Plus, Trash2 } from 'lucide-react';

type DespensaItem = {
  produtoId: string;
  nome: string;
  cicloDias: number;
  diasDesdeUltimaCompra: number | null;
  diasRestantes: number | null;
  status: 'ok' | 'atencao' | 'acabando';
  frequenciaLista: number;
  fonte: 'inferido' | 'manual';
};

const STATUS_LABEL: Record<DespensaItem['status'], string> = {
  acabando: 'Acabando',
  atencao: 'Atenção',
  ok: 'OK',
};

const STATUS_COLOR: Record<DespensaItem['status'], string> = {
  acabando: 'bg-red-100 text-red-800',
  atencao: 'bg-amber-100 text-amber-900',
  ok: 'bg-emerald-100 text-emerald-800',
};

export default function DespensaPage() {
  const searchParams = useSearchParams();
  const [mercadoId, setMercadoId] = useState('');
  const [itens, setItens] = useState<DespensaItem[]>([]);
  const [resumo, setResumo] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState('');
  const [novoCiclo, setNovoCiclo] = useState('14');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const m = searchParams.get('mercadoId');
    if (m) setMercadoId(m);
  }, [searchParams]);

  const carregar = useCallback(async () => {
    if (!mercadoId) return;
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch(`/api/cliente/despensa?mercadoId=${encodeURIComponent(mercadoId)}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Falha ao carregar');
      setItens(json.data.itens ?? []);
      setResumo(json.data.resumo ?? '');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro');
      setItens([]);
    } finally {
      setLoading(false);
    }
  }, [mercadoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const adicionarManual = async () => {
    if (!mercadoId || !novoNome.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      const pid = `manual-${Date.now()}`;
      const res = await fetch('/api/cliente/despensa', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'adicionar',
          entrada: {
            produtoId: pid,
            nome: novoNome.trim(),
            cicloDias: parseInt(novoCiclo, 10) || 14,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Falha ao salvar');
      setNovoNome('');
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const removerManual = async (produtoId: string) => {
    setSalvando(true);
    try {
      await fetch('/api/cliente/despensa', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'remover', produtoId }),
      });
      await carregar();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <DashboardLayout role="CLIENTE">
      <ClientePage
        title="Despensa digital"
        description="Itens que você costuma repor — inferidos ou manuais"
      >
      <div className="mx-auto max-w-lg space-y-5">
        <MercadoSelector value={mercadoId} onChange={setMercadoId} />

        {resumo && !loading && (
          <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">{resumo}</p>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : (
          <ul className="space-y-2">
            {itens.map((item) => (
              <li
                key={item.produtoId}
                className="flex items-start justify-between gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.nome}</p>
                  <p className="text-xs text-gray-500">
                    Ciclo ~{item.cicloDias} dias
                    {item.diasRestantes != null && ` · repor em ~${item.diasRestantes}d`}
                    {item.fonte === 'manual' && ' · manual'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLOR[item.status]}`}
                  >
                    {STATUS_LABEL[item.status]}
                  </span>
                  {item.fonte === 'manual' && (
                    <button
                      type="button"
                      disabled={salvando}
                      onClick={() => void removerManual(item.produtoId)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
            {itens.length === 0 && mercadoId && (
              <p className="text-center text-sm text-gray-500 py-8">
                Nenhum item ainda. Adicione manualmente ou use listas/compras para inferir.
              </p>
            )}
          </ul>
        )}

        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Adicionar manual</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Ex.: Leite integral"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={3}
              max={60}
              value={novoCiclo}
              onChange={(e) => setNovoCiclo(e.target.value)}
              className="w-20 rounded-lg border border-gray-300 px-2 py-2 text-sm"
              title="Ciclo em dias"
            />
            <button
              type="button"
              disabled={salvando || !mercadoId || !novoNome.trim()}
              onClick={() => void adicionarManual()}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          </div>
        </div>

        {erro && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {erro}
          </p>
        )}
      </div>
      </ClientePage>
    </DashboardLayout>
  );
}
