/**
 * Casa / Agora — status do ciclo alimentar (shell AI-Native Fase 1).
 * Reutiliza cards e engines existentes; muda hierarquia e CTAs.
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/hooks/useUnifiedSession';
import { Loader2, ShoppingCart, Users } from 'lucide-react';
import { useLista } from '@/app/context/ListaContext';
import { listasSalvasToSummaries, mergeListSummaries } from '@/lib/listas-merge';
import { UX } from '@/lib/ux-copy';
import { CASA } from '@/lib/ux-copy-casa';
import { useToast } from '@/components/ToastContainer';

import { EconomyCard } from '@/components/cliente/EconomyCard';
import { RecentLists } from '@/components/cliente/RecentLists';
import { StreakCounter } from '@/components/cliente/StreakCounter';
import { CestaProvavelCard } from '@/components/cliente/CestaProvavelCard';
import { ModoEmergenciaCard } from '@/components/cliente/ModoEmergenciaCard';
import { EsperaQueValeCard } from '@/components/cliente/EsperaQueValeCard';
import { AtacadoVarejoCard } from '@/components/cliente/AtacadoVarejoCard';
import { TrocaHistoricoCard } from '@/components/cliente/TrocaHistoricoCard';
import { ProvaSocialMercadoCard } from '@/components/cliente/ProvaSocialMercadoCard';
import { RaioFamiliarCard } from '@/components/cliente/RaioFamiliarCard';
import { CasaCompartilharBanner } from '@/components/cliente/casa/CasaCompartilharBanner';
import { MercadoVivoBanner } from '@/components/cliente/MercadoVivoBanner';
import { InflacaoCestaCard } from '@/components/cliente/InflacaoCestaCard';
import { PreciIndexBairroCard } from '@/components/cliente/PreciIndexBairroCard';
import { EconomiaStreakCard } from '@/components/cliente/EconomiaStreakCard';
import { ShareEconomiaCard } from '@/components/cliente/ShareEconomiaCard';
import { NotificacaoPermissaoBanner } from '@/components/cliente/NotificacaoPermissaoBanner';
import { OnboardingChecklist } from '@/components/cliente/OnboardingChecklist';
import { HubPreciBar } from '@/components/cliente/HubPreciBar';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import Link from 'next/link';

interface DashboardData {
  economy: { totalSavings: number; savingsThisMonth: number };
  lists: Array<{
    id: string;
    name: string;
    itemsCount: number;
    totalSavings: number;
    updatedAt: string;
  }>;
}

export function CasaAgoraScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mercadoId, setMercadoId] = useState<string | null>(null);
  const [montando, setMontando] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const { listasSalvas, totalItens, criarNovaLista, adicionarItem } = useLista();
  const { success, error: toastError } = useToast();

  const localLists = useMemo(() => listasSalvasToSummaries(listasSalvas), [listasSalvas]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!userId) {
      setData({
        economy: { totalSavings: 0, savingsThisMonth: 0 },
        lists: localLists.slice(0, 6),
      });
      setIsLoading(false);
      return;
    }

    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        const [statsRes, listsRes] = await Promise.all([
          fetch(`/api/stats/global?userId=${userId}`, { credentials: 'include', cache: 'no-store' }),
          fetch('/api/lists?limit=6', { credentials: 'include', cache: 'no-store' }),
        ]);
        const [statsData, listsData] = await Promise.all([statsRes.json(), listsRes.json()]);
        setData({
          economy: {
            totalSavings: statsData.data?.totalSavings || 0,
            savingsThisMonth: statsData.data?.savingsThisMonth || 0,
          },
          lists: mergeListSummaries(listsData.data?.lists || [], localLists).slice(0, 6),
        });
      } catch {
        setError('Não conseguimos carregar seus dados agora. Tente de novo em instantes.');
        setData({
          economy: { totalSavings: 0, savingsThisMonth: 0 },
          lists: localLists.slice(0, 6),
        });
      } finally {
        setIsLoading(false);
      }
    }

    void fetchDashboardData();
  }, [userId, status, localLists]);

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

  const revisarCompra = useCallback(async () => {
    if (totalItens > 0) {
      router.push('/cliente/compra');
      return;
    }
    if (!mercadoId) {
      router.push('/cliente/compra');
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
        throw new Error(json.error || 'Não foi possível montar a compra');
      }
      const { nome, itens } = json.data;
      criarNovaLista(nome);
      for (const item of itens) {
        adicionarItem(item);
      }
      success('Compra sugerida pronta para revisar.');
      router.push('/cliente/compra');
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Tente de novo');
      router.push('/cliente/compra');
    } finally {
      setMontando(false);
    }
  }, [totalItens, mercadoId, router, criarNovaLista, adicionarItem, success, toastError]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-5 sm:py-6">
        <header className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
            {CASA.titulo}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {UX.casaAgora.titulo}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{UX.casaAgora.subtitulo}</p>

          <button
            type="button"
            onClick={() => void revisarCompra()}
            disabled={montando}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60"
          >
            {montando ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <ShoppingCart className="h-5 w-5" aria-hidden />
            )}
            {UX.casaAgora.ctaPrimario}
            {totalItens > 0 && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs tabular-nums">
                {totalItens}
              </span>
            )}
          </button>

          <Link
            href="/cliente/familia"
            className="mt-3 flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Users className="h-4 w-4 text-slate-500" aria-hidden />
            {UX.casaAgora.membros}
          </Link>
        </header>

        <section className="mb-4">
          <HubPreciBar />
        </section>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700"
          >
            {error}
          </div>
        )}

        {!isLoading && userId && (
          <div className="mb-4">
            <NotificacaoPermissaoBanner />
          </div>
        )}

        {!isLoading && userId && (
          <div className="mb-4">
            <OnboardingChecklist />
          </div>
        )}

        {!isLoading && userId && (
          <div className="mb-4">
            <CasaCompartilharBanner />
          </div>
        )}

        <section className="mb-4">
          <EconomyCard
            totalSavings={data?.economy.totalSavings || 0}
            savingsThisMonth={data?.economy.savingsThisMonth || 0}
            isLoading={isLoading}
          />
        </section>

        {!isLoading && (
          <section className="mb-4">
            <StreakCounter userId={userId} />
          </section>
        )}

        <section className="mb-4">
          <RecentLists lists={data?.lists || []} isLoading={isLoading} />
        </section>

        {!isLoading && userId && (
          <div className="flex flex-col gap-3">
            <CollapsibleSection
              title="Perto de você"
              description="Mercados, preços do bairro e o que está em alta"
              defaultOpen={false}
            >
              <RaioFamiliarCard />
              <MercadoVivoBanner />
              <PreciIndexBairroCard mercadoId={mercadoId} />
              <ProvaSocialMercadoCard mercadoId={mercadoId} />
            </CollapsibleSection>

            <CollapsibleSection
              title="Economize mais"
              description="Cesta, melhor hora e comparações"
              defaultOpen={false}
            >
              <CestaProvavelCard mercadoId={mercadoId} />
              <EsperaQueValeCard mercadoId={mercadoId} />
              <AtacadoVarejoCard mercadoId={mercadoId} />
              <InflacaoCestaCard mercadoId={mercadoId} />
              <ModoEmergenciaCard mercadoId={mercadoId} />
              <TrocaHistoricoCard mercadoId={mercadoId} />
            </CollapsibleSection>

            <CollapsibleSection
              title="Sua jornada"
              description="Sequência de economia e conquistas"
              defaultOpen={false}
            >
              <EconomiaStreakCard />
              <ShareEconomiaCard />
            </CollapsibleSection>
          </div>
        )}
      </div>
    </main>
  );
}
