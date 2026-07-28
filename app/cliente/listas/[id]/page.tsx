'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useLista } from '@/app/context/ListaContext';
import { ClientePage } from '@/components/cliente/ClientePage';
import { UX } from '@/lib/ux-copy';
import {
  apiProductToItemLista,
  fetchListaRemota,
  isListaLocal,
} from '@/lib/lista-ativar';
import { isAiNativeShellEnabled } from '@/lib/ai-native-shell';

/**
 * Detalhe/edição de lista — ativa a lista e encaminha para Compra (Fase 2).
 * Listas locais: selecionarLista. Remotas: hidrata ListaContext a partir da API.
 */
export default function ListaDetalhePage() {
  const params = useParams();
  const listId = typeof params?.id === 'string' ? params.id : '';
  const router = useRouter();
  const { selecionarLista, criarNovaLista, adicionarItem, listasSalvas } = useLista();
  const [erro, setErro] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!listId) {
      setErro('Lista não encontrada.');
      setBusy(false);
      return;
    }

    let cancelled = false;

    async function ativar() {
      setBusy(true);
      setErro(null);
      try {
        if (isListaLocal(listId)) {
          const existe = listasSalvas.some((l) => l.id === listId);
          if (!existe) {
            if (!cancelled) setErro('Esta lista local não está mais disponível neste aparelho.');
            return;
          }
          selecionarLista(listId);
        } else {
          const remote = await fetchListaRemota(listId);
          if (!remote) {
            if (!cancelled) setErro('Não encontramos essa lista. Verifique se ainda existe.');
            return;
          }
          criarNovaLista(remote.name || 'Lista');
          for (const p of remote.products || []) {
            adicionarItem(apiProductToItemLista(p));
          }
        }

        if (cancelled) return;
        const dest = isAiNativeShellEnabled() ? '/cliente/compra' : '/cliente/busca';
        router.replace(dest);
      } catch {
        if (!cancelled) setErro('Não foi possível abrir a lista. Tente de novo.');
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    void ativar();
    return () => {
      cancelled = true;
    };
    // listasSalvas intencional na 1ª carga; evitar re-hidratar em loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId]);

  return (
    <ClientePage title={UX.lista.titulo} description="Abrindo sua compra…">
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-4 py-16 text-center">
        {busy && !erro && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden />
            <p className="text-sm text-slate-500">Preparando a lista para revisar…</p>
          </>
        )}
        {erro && (
          <>
            <p className="text-sm text-error-700" role="alert">
              {erro}
            </p>
            <Link
              href="/cliente/listas"
              className="min-h-[44px] rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Voltar às listas
            </Link>
          </>
        )}
      </div>
    </ClientePage>
  );
}
