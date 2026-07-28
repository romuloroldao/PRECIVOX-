'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ListChecks, Sparkles, Loader2, Plus } from 'lucide-react';
import { ListaInteligentePanel } from '@/components/ListaInteligentePanel';
import { CompraConfirmacaoPrompt } from '@/components/cliente/CompraConfirmacaoPrompt';
import { useLista } from '@/app/context/ListaContext';
import { UX } from '@/lib/ux-copy';
import { ClientePage } from '@/components/cliente/ClientePage';
import { useToast } from '@/components/ToastContainer';

/**
 * Aba Compra — Lista Inteligente full-bleed (Fase 2: compra-first).
 * CTA primário monta rascunho (cesta da semana) em 1 toque.
 * Criar lista vazia / buscar = secundário.
 */
export default function ClienteCompraPage() {
  const router = useRouter();
  const { totalItens, total, listaAtivaId, criarNovaLista, adicionarItem } = useLista();
  const { success, error: toastError } = useToast();
  const [mercadoId, setMercadoId] = useState<string | null>(null);
  const [montando, setMontando] = useState(false);
  const [promptAtivo, setPromptAtivo] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/nps/suggest-mercado', { cache: 'no-store' });
        const json = await res.json();
        if (json.mercadoId) setMercadoId(json.mercadoId);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  /** Após montar/abrir compra com itens, oferece confirmação (mesmo loop da busca). */
  useEffect(() => {
    if (totalItens < 1) {
      setPromptAtivo(false);
      return;
    }
    const t = setTimeout(() => setPromptAtivo(true), 90_000);
    return () => clearTimeout(t);
  }, [totalItens]);

  const montarRascunho = useCallback(async () => {
    if (montando) return;
    if (!mercadoId) {
      toastError('Não encontramos um mercado de referência. Busque um produto para começar.');
      router.push('/cliente/busca');
      return;
    }
    setMontando(true);
    try {
      const res = await fetch('/api/cliente/cesta-semana', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mercadoId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Não foi possível montar a compra sugerida');
      }
      const { nome, itens } = json.data;
      criarNovaLista(nome);
      for (const item of itens) {
        adicionarItem(item);
      }
      success('Compra sugerida pronta para revisar.');
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Tente de novo');
    } finally {
      setMontando(false);
    }
  }, [montando, mercadoId, criarNovaLista, adicionarItem, success, toastError, router]);

  return (
    <ClientePage
      title={UX.compra.titulo}
      description={totalItens === 0 ? UX.compra.subtituloVazia : undefined}
    >
      {totalItens === 0 ? (
        <div className="mx-auto flex max-w-lg flex-col gap-3 px-1 py-6">
          <button
            type="button"
            onClick={() => void montarRascunho()}
            disabled={montando}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {montando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden />
            )}
            {UX.compra.montarSemana}
          </button>
          <Link
            href="/cliente/busca"
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Search className="h-4 w-4" aria-hidden />
            {UX.compra.irBuscar}
          </Link>
          <Link
            href="/cliente/listas"
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ListChecks className="h-4 w-4" aria-hidden />
            {UX.compra.verListas}
          </Link>
          <Link
            href="/cliente/listas/nova"
            className="flex min-h-[44px] items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {UX.compra.listaVazia}
          </Link>
        </div>
      ) : (
        <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ListaInteligentePanel
            variant="inline"
            onClose={() => router.push('/cliente/busca')}
          />
        </div>
      )}

      {mercadoId && (
        <CompraConfirmacaoPrompt
          mercadoId={mercadoId}
          listaId={listaAtivaId}
          itensCount={totalItens}
          valorEstimado={total}
          ativo={promptAtivo}
        />
      )}
    </ClientePage>
  );
}
