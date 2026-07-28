'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/hooks/useUnifiedSession';
import { Sparkles, X } from 'lucide-react';

type RefinamentoPendente = {
  mensagem: string;
  em: string;
};

export function ElRefinamentoToast() {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const [pendente, setPendente] = useState<RefinamentoPendente | null>(null);
  const [visivel, setVisivel] = useState(false);
  const [processando, setProcessando] = useState(false);

  const carregar = useCallback(async () => {
    const res = await fetch('/api/cliente/perfil-preci', { credentials: 'include', cache: 'no-store' });
    if (!res.ok) return;
    const json = await res.json();
    const p = json.data?.elRefinamentoPendente as RefinamentoPendente | null | undefined;
    if (p?.mensagem) {
      setPendente(p);
      setVisivel(true);
    }
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' || role !== 'CLIENTE') return;
    void carregar();
  }, [status, role, carregar]);

  useEffect(() => {
    const handler = () => void carregar();
    window.addEventListener('precivox-el-refinamento-atualizado', handler);
    return () => window.removeEventListener('precivox-el-refinamento-atualizado', handler);
  }, [carregar]);

  const enviar = async (acao: 'confirmar' | 'desfazer') => {
    setProcessando(true);
    try {
      const res = await fetch('/api/cliente/el-refinamento', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Erro');
      setVisivel(false);
      setPendente(null);
    } finally {
      setProcessando(false);
    }
  };

  if (status !== 'authenticated' || role !== 'CLIENTE' || !visivel || !pendente) return null;

  return (
    <div
      className="fixed bottom-[calc(var(--cliente-bottom-nav-height)+1rem)] left-4 right-4 z-[55] mx-auto max-w-md md:bottom-8 md:left-8 md:right-auto"
      role="status"
    >
      <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl ring-1 ring-emerald-100">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">Ajustamos suas recomendações</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">{pendente.mensagem}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={processando}
                onClick={() => void enviar('confirmar')}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Entendi
              </button>
              <button
                type="button"
                disabled={processando}
                onClick={() => void enviar('desfazer')}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Desfazer
              </button>
              <Link
                href="/cliente/perfil"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-700 hover:underline"
              >
                Ajustar no perfil
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void enviar('confirmar')}
            className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
