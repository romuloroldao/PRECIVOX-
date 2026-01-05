/**
 * Dashboard Cliente - Tela Principal
 * 
 * SQUAD A - Frontend/UX
 * 
 * Tela principal após login do cliente
 * Mostra economia, listas recentes, badges
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/shared';
import { EconomyCard } from '@/components/cliente/EconomyCard';
import { RecentLists } from '@/components/cliente/RecentLists';
import { StreakCounter } from '@/components/cliente/StreakCounter';
import { TOKENS } from '@/styles/tokens';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  // TODO: Pegar userId real do NextAuth
  const userId = 'temp-user-id';

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);

        // Buscar dados em paralelo
        const [statsRes, listsRes, badgesRes] = await Promise.all([
          fetch(`/api/stats/global?userId=${userId}`),
          fetch(`/api/lists?userId=${userId}&limit=6`),
          fetch(`/api/gamification/badges?userId=${userId}`),
        ]);

        const [statsData, listsData, badgesData] = await Promise.all([
          statsRes.json(),
          listsRes.json(),
          badgesRes.json(),
        ]);

        // Processar dados
        setData({
          economy: {
            totalSavings: statsData.data?.totalSavings || 0,
            savingsThisMonth: statsData.data?.savingsThisMonth || 0,
          },
          lists: listsData.data?.lists || [],
          badges: {
            unlocked: badgesData.data?.stats?.unlockedBadges || 0,
            total: badgesData.data?.stats?.totalBadges || 12,
            recentlyUnlocked: [],
          },
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Erro ao carregar dados');

        // Fallback para dados mock
        setData({
          economy: {
            totalSavings: 15000, // R$ 150,00
            savingsThisMonth: 4500, // R$ 45,00
          },
          lists: [],
          badges: {
            unlocked: 3,
            total: 12,
            recentlyUnlocked: [],
          },
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [userId]);

  const handleCreateList = () => {
    router.push('/cliente/listas/nova');
  };

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.greeting}>Olá! 👋</h1>
            <p style={styles.subtitle}>Veja sua economia e listas</p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleCreateList}
            leftIcon={<span>➕</span>}
          >
            Nova Lista
          </Button>
        </header>

        {/* Economy Card */}
        <section style={styles.economySection}>
          <EconomyCard
            totalSavings={data?.economy.totalSavings || 0}
            savingsThisMonth={data?.economy.savingsThisMonth || 0}
            isLoading={isLoading}
          />
        </section>

        {/* Quick Stats */}
        {!isLoading && data && (
          <section style={styles.quickStats}>
            <StatCard
              icon="📝"
              label="Listas"
              value={data.lists.length.toString()}
              color={TOKENS.colors.primary[600]}
            />
            <StatCard
              icon="🏆"
              label="Badges"
              value={`${data.badges.unlocked}/${data.badges.total}`}
              color={TOKENS.colors.secondary[600]}
            />
            <StatCard
              icon="📊"
              label="Este Mês"
              value={`R$ ${(data.economy.savingsThisMonth / 100).toFixed(0)}`}
              color={TOKENS.colors.accent[600]}
            />
          </section>
        )}

        {/* Streak Counter */}
        {!isLoading && (
          <section style={styles.streakSection}>
            <StreakCounter userId={userId} />
          </section>
        )}

        {/* Recent Lists */}
        <section style={styles.listsSection}>
          <RecentLists
            lists={data?.lists || []}
            isLoading={isLoading}
          />
        </section>

        {/* CTA Section */}
        {!isLoading && data && data.lists.length === 0 && (
          <section style={styles.ctaSection}>
            <div style={styles.ctaCard}>
              <span style={styles.ctaIcon}>🎯</span>
              <h3 style={styles.ctaTitle}>Comece a Economizar!</h3>
              <p style={styles.ctaText}>
                Crie sua primeira lista e descubra onde comprar mais barato
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={handleCreateList}
                fullWidth
              >
                Criar Primeira Lista
              </Button>
            </div>
          </section>
        )}

        {/* Error State */}
        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}
      </div>
    </main>
  );
}

// Componente auxiliar: StatCard
function StatCard({
  icon,
  label,
  value,
  color
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div style={styles.statCard}>
      <span style={{ ...styles.statIcon, color }}>{icon}</span>
      <div>
        <p style={styles.statValue}>{value}</p>
        <p style={styles.statLabel}>{label}</p>
      </div>
    </div>
  );
}

// Estilos - Mobile-First usando TOKENS
const styles = {
  main: {
    minHeight: '100vh',
    backgroundColor: TOKENS.colors.surface,
  },

  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: TOKENS.spacing[4],
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: TOKENS.spacing[6],
    flexWrap: 'wrap' as const,
    gap: TOKENS.spacing[4],
  },

  greeting: {
    fontSize: TOKENS.typography.fontSize['3xl'],
    fontWeight: TOKENS.typography.fontWeight.extrabold,
    color: TOKENS.colors.text.primary,
    margin: 0,
    marginBottom: TOKENS.spacing[1],
  },

  subtitle: {
    fontSize: TOKENS.typography.fontSize.base,
    color: TOKENS.colors.text.secondary,
    margin: 0,
  },

  economySection: {
    marginBottom: TOKENS.spacing[6],
  },

  quickStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: TOKENS.spacing[4],
    marginBottom: TOKENS.spacing[6],
  },

  streakSection: {
    marginBottom: TOKENS.spacing[6],
  },

  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[3],
    padding: TOKENS.spacing[4],
    backgroundColor: TOKENS.colors.background,
    borderRadius: TOKENS.borderRadius.lg,
    border: `${TOKENS.borderWidth[1]} solid ${TOKENS.colors.border}`,
  },

  statIcon: {
    fontSize: '32px',
  },

  statValue: {
    fontSize: TOKENS.typography.fontSize.xl,
    fontWeight: TOKENS.typography.fontWeight.bold,
    color: TOKENS.colors.text.primary,
    margin: 0,
    marginBottom: TOKENS.spacing[1],
  },

  statLabel: {
    fontSize: TOKENS.typography.fontSize.sm,
    color: TOKENS.colors.text.secondary,
    margin: 0,
  },

  listsSection: {
    marginBottom: TOKENS.spacing[6],
  },

  ctaSection: {
    marginTop: TOKENS.spacing[8],
  },

  ctaCard: {
    textAlign: 'center' as const,
    padding: TOKENS.spacing[8],
    backgroundColor: TOKENS.colors.background,
    borderRadius: TOKENS.borderRadius.xl,
    border: `${TOKENS.borderWidth[2]} dashed ${TOKENS.colors.border}`,
  },

  ctaIcon: {
    fontSize: '64px',
    display: 'block',
    marginBottom: TOKENS.spacing[4],
  },

  ctaTitle: {
    fontSize: TOKENS.typography.fontSize['2xl'],
    fontWeight: TOKENS.typography.fontWeight.bold,
    color: TOKENS.colors.text.primary,
    marginBottom: TOKENS.spacing[2],
  },

  ctaText: {
    fontSize: TOKENS.typography.fontSize.base,
    color: TOKENS.colors.text.secondary,
    marginBottom: TOKENS.spacing[6],
    maxWidth: '400px',
    margin: `0 auto ${TOKENS.spacing[6]} auto`,
  },

  error: {
    padding: TOKENS.spacing[4],
    backgroundColor: TOKENS.colors.error,
    color: TOKENS.colors.text.inverse,
    borderRadius: TOKENS.borderRadius.md,
    textAlign: 'center' as const,
    marginTop: TOKENS.spacing[4],
  },
};
