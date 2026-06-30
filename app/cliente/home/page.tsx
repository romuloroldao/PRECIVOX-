/**
 * Home do Cliente — tela principal após o login.
 *
 * Princípios desta tela (mobile-first):
 * - Uma única ação principal clara: "Começar compra".
 * - Divulgação progressiva: recursos avançados ficam atrás de seções
 *   colapsáveis para evitar excesso de informação.
 * - Linguagem simples em todos os textos.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/hooks/useUnifiedSession';
import { Plus, Search, ShoppingCart } from 'lucide-react';
import { useLista } from '@/app/context/ListaContext';
import { listasSalvasToSummaries, mergeListSummaries } from '@/lib/listas-merge';

import { EconomyCard } from '@/components/cliente/EconomyCard';
import { RecentLists } from '@/components/cliente/RecentLists';
import { StreakCounter } from '@/components/cliente/StreakCounter';
import { CestaProvavelCard } from '@/components/cliente/CestaProvavelCard';
import { ModoEmergenciaCard } from '@/components/cliente/ModoEmergenciaCard';
import { EsperaQueValeCard } from '@/components/cliente/EsperaQueValeCard';
import { AtacadoVarejoCard } from '@/components/cliente/AtacadoVarejoCard';
import { TrocaHistoricoCard } from '@/components/cliente/TrocaHistoricoCard';
import { ProvaSocialMercadoCard } from '@/components/cliente/ProvaSocialMercadoCard';
import { ScanInteligenteEntry } from '@/components/cliente/ScanInteligenteEntry';
import { RaioFamiliarCard } from '@/components/cliente/RaioFamiliarCard';
import { MercadoVivoBanner } from '@/components/cliente/MercadoVivoBanner';
import { InflacaoCestaCard } from '@/components/cliente/InflacaoCestaCard';
import { PreciIndexBairroCard } from '@/components/cliente/PreciIndexBairroCard';
import { EconomiaStreakCard } from '@/components/cliente/EconomiaStreakCard';
import { ShareEconomiaCard } from '@/components/cliente/ShareEconomiaCard';
import { NotificacaoPermissaoBanner } from '@/components/cliente/NotificacaoPermissaoBanner';
import { OnboardingChecklist } from '@/components/cliente/OnboardingChecklist';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';

interface DashboardData {
  economy: {
    totalSavings: number;
    savingsThisMonth: number;
  };
  lists: Array<{
    id: string;
    name: string;
    itemsCount: number;
    totalSavings: number;
    updatedAt: string;
  }>;
  badges: {
    unlocked: number;
    total: number;
    recentlyUnlocked: any[];
  };
}

export default function DashboardCliente() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mercadoId, setMercadoId] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  const userId = (session?.user as any)?.id ?? null;
  const { listasSalvas } = useLista();

  const localLists = useMemo(
    () => listasSalvasToSummaries(listasSalvas),
    [listasSalvas]
  );

  useEffect(() => {
    if (status === 'loading') return;
    if (!userId) {
      setData({
        economy: { totalSavings: 0, savingsThisMonth: 0 },
        lists: localLists.slice(0, 6),
        badges: { unlocked: 0, total: 12, recentlyUnlocked: [] },
      });
      setIsLoading(false);
      return;
    }

    async function fetchDashboardData() {
      try {
        setIsLoading(true);

        const [statsRes, listsRes, badgesRes] = await Promise.all([
          fetch(`/api/stats/global?userId=${userId}`, { credentials: 'include', cache: 'no-store' }),
          fetch('/api/lists?limit=6', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/gamification/badges', { credentials: 'include', cache: 'no-store' }),
        ]);

        const [statsData, listsData, badgesData] = await Promise.all([
          statsRes.json(),
          listsRes.json(),
          badgesRes.json(),
        ]);

        setData({
          economy: {
            totalSavings: statsData.data?.totalSavings || 0,
            savingsThisMonth: statsData.data?.savingsThisMonth || 0,
          },
          lists: mergeListSummaries(listsData.data?.lists || [], localLists).slice(0, 6),
          badges: {
            unlocked: badgesData.data?.stats?.unlockedBadges ?? badgesData.data?.unlockedBadges ?? 0,
            total: badgesData.data?.stats?.totalBadges ?? badgesData.data?.totalBadges ?? 12,
            recentlyUnlocked: [],
          },
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Não conseguimos carregar seus dados agora. Tente de novo em instantes.');
        setData({
          economy: { totalSavings: 0, savingsThisMonth: 0 },
          lists: localLists.slice(0, 6),
          badges: { unlocked: 0, total: 12, recentlyUnlocked: [] },
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [userId, status, localLists]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/nps/suggest-mercado', { cache: 'no-store' });
        const data = await res.json();
        if (data.mercadoId) setMercadoId(data.mercadoId);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const goBusca = () => router.push('/cliente/busca');
  const hasLists = !!data && data.lists.length > 0;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-5 sm:py-6">
        {/* Cabeçalho: saudação + UMA ação principal */}
        <header className="mb-5">
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Olá! 👋</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monte sua lista e veja onde comprar mais barato.
          </p>

          <button
            onClick={goBusca}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <Plus className="h-5 w-5" aria-hidden />
            Começar compra
          </button>

          {/* Atalhos secundários (rolagem horizontal no mobile) */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <QuickChip icon={Search} label="Buscar" onClick={goBusca} />
            <ScanInteligenteEntry mercadoId={mercadoId} />
            <QuickChip
              icon={ShoppingCart}
              label="Modo corredor"
              onClick={() => router.push('/cliente/mercado-vivo')}
            />
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700"
          >
            {error}
          </div>
        )}

        {/* Aviso contextual de permissão (quando aplicável) */}
        {!isLoading && userId && (
          <div className="mb-4">
            <NotificacaoPermissaoBanner />
          </div>
        )}

        {/* Onboarding: checklist de primeiro acesso */}
        {!isLoading && userId && (
          <div className="mb-4">
            <OnboardingChecklist />
          </div>
        )}

        {/* Economia: o número mais importante, em destaque */}
        <section className="mb-4">
          <EconomyCard
            totalSavings={data?.economy.totalSavings || 0}
            savingsThisMonth={data?.economy.savingsThisMonth || 0}
            isLoading={isLoading}
          />
        </section>

        {/* Resumo rápido */}
        {!isLoading && data && (
          <section className="mb-4 grid grid-cols-3 gap-3">
            <StatCard icon="📝" label="Listas" value={data.lists.length.toString()} />
            <StatCard icon="🏆" label="Conquistas" value={`${data.badges.unlocked}/${data.badges.total}`} />
            <StatCard icon="📊" label="Este mês" value={`R$ ${(data.economy.savingsThisMonth / 100).toFixed(0)}`} />
          </section>
        )}

        {!isLoading && (
          <section className="mb-4">
            <StreakCounter userId={userId} />
          </section>
        )}

        {/* Listas recentes */}
        <section className="mb-4">
          <RecentLists lists={data?.lists || []} isLoading={isLoading} />
        </section>

        {/* Estado vazio educativo: só quando não há listas */}
        {!isLoading && data && !hasLists && (
          <section className="mb-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-8 text-center">
            <span className="mb-3 block text-5xl">🎯</span>
            <h3 className="text-lg font-bold text-slate-900">Comece a economizar</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              Crie sua primeira lista e descubra onde os mesmos produtos saem mais baratos.
            </p>
            <button
              onClick={goBusca}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-700 sm:w-auto"
            >
              <Plus className="h-5 w-5" aria-hidden />
              Criar primeira lista
            </button>
          </section>
        )}

        {/* Recursos avançados — escondidos por padrão para evitar excesso */}
        {!isLoading && userId && (
          <div className="flex flex-col gap-3">
            <CollapsibleSection
              title="Perto de você"
              description="Mercados, preços do bairro e o que está em alta"
            >
              <RaioFamiliarCard />
              <MercadoVivoBanner />
              <PreciIndexBairroCard mercadoId={mercadoId} />
              <ProvaSocialMercadoCard mercadoId={mercadoId} />
            </CollapsibleSection>

            <CollapsibleSection
              title="Economize mais"
              description="Cesta provável, melhor hora de comprar e comparações"
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
              description="Sequência de economia e conquistas para compartilhar"
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

function QuickChip({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Search;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
    >
      <Icon className="h-4 w-4 text-slate-500" aria-hidden />
      {label}
    </button>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center">
      <span className="text-xl" aria-hidden>
        {icon}
      </span>
      <p className="mt-1 text-lg font-bold leading-none text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}
