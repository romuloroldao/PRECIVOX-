'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Loader2, Zap } from 'lucide-react';
import { useLista } from '@/app/context/ListaContext';
import { useToast } from '@/components/ToastContainer';

interface Props {
  mercadoId: string | null;
}

export function ModoEmergenciaCard({ mercadoId }: Props) {
  const router = useRouter();
  const { criarNovaLista, adicionarItem } = useLista();
  const { success, error: toastError } = useToast();
  const [montando, setMontando] = useState(false);
  const [preview, setPreview] = useState<{
    itens: { nome: string; motivo: string }[];
    resumo: string;
  } | null>(null);

  useEffect(() => {
    if (!mercadoId) return;
    void (async () => {
      try {
        const res = await fetch(`/api/cliente/modo-emergencia?mercadoId=${mercadoId}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        const json = await res.json();
        if (json.success && json.data.itens?.length) {
          setPreview({ itens: json.data.itens, resumo: json.data.resumo });
        }
      } catch {
        /* ignore */
      }
    })();
  }, [mercadoId]);

  const montarJantarHoje = async () => {
    if (!mercadoId || montando) return;
    setMontando(true);
    try {
      const res = await fetch('/api/cliente/modo-emergencia', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mercadoId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Não foi possível montar a lista');
      }

      const { nome, itens, adicionados, resumo } = json.data;
      criarNovaLista(nome);
      for (const item of itens) {
        adicionarItem(item);
      }

      success(`Modo emergência — ${adicionados} item(ns) na lista`);
      if (resumo) sessionStorage.setItem('precivox_modo_emergencia_resumo', resumo);
      router.push('/cliente/busca');
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Erro ao montar jantar');
    } finally {
      setMontando(false);
    }
  };

  if (!mercadoId || !preview?.itens.length) return null;

  return (
    <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm">
      <div className="flex items-start gap-2">
        <Flame className="h-5 w-5 shrink-0 text-orange-600" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-orange-950">Jantar hoje</h3>
          <p className="mt-1 text-xs text-orange-900/85">{preview.resumo}</p>
          <ul className="mt-2 space-y-1">
            {preview.itens.map((item, i) => (
              <li key={i} className="text-xs text-gray-700">
                <span className="font-medium">{item.nome}</span>
                <span className="text-gray-500"> — {item.motivo}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => void montarJantarHoje()}
            disabled={montando}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {montando ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            Montar em 1 toque (5 itens · 1 mercado)
          </button>
        </div>
      </div>
    </div>
  );
}
