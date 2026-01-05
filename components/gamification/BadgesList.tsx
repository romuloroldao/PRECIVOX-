/**
 * BadgesList Component - Lista de Badges
 * 
 * SQUAD A - Frontend/UX
 * 
 * Grid de badges com filtros
 */

'use client';

import React, { useState } from 'react';
import { TOKENS } from '@/styles/tokens';
import { Badge, BadgeProps } from './Badge';

type FilterType = 'all' | 'unlocked' | 'locked';

interface BadgesListProps {
  badges: (BadgeProps & { id: string })[];
  onBadgeClick?: (badge: BadgeProps & { id: string }) => void;
  isLoading?: boolean;
}

export function BadgesList({ badges, onBadgeClick, isLoading = false }: BadgesListProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredBadges = badges.filter((badge) => {
    if (filter === 'all') return true;
    if (filter === 'unlocked') return badge.unlocked;
    if (filter === 'locked') return !badge.unlocked;
    return true;
  });

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const lockedCount = badges.filter((b) => !b.unlocked).length;

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Carregando badges...</div>
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>🏆</span>
          <p style={styles.emptyText}>Nenhum badge disponível ainda</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Filters */}
      <div style={styles.filters}>
        <button
          onClick={() => setFilter('all')}
          style={{
            ...styles.filterButton,
            ...(filter === 'all' ? styles.filterButtonActive : {}),
          }}
        >
          Todos ({badges.length})
        </button>
        <button
          onClick={() => setFilter('unlocked')}
          style={{
            ...styles.filterButton,
            ...(filter === 'unlocked' ? styles.filterButtonActive : {}),
          }}
        >
          Desbloqueados ({unlockedCount})
        </button>
        <button
          onClick={() => setFilter('locked')}
          style={{
            ...styles.filterButton,
            ...(filter === 'locked' ? styles.filterButtonActive : {}),
          }}
        >
          Bloqueados ({lockedCount})
        </button>
      </div>

      {/* Grid */}
      {filteredBadges.length > 0 ? (
        <div style={styles.grid}>
          {filteredBadges.map((badge) => (
            <Badge
              key={badge.id}
              {...badge}
              onClick={() => onBadgeClick?.(badge)}
            />
          ))}
        </div>
      ) : (
        <div style={styles.empty}>
          <p style={styles.emptyText}>
            Nenhum badge {filter === 'unlocked' ? 'desbloqueado' : 'bloqueado'} ainda
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
  },

  filters: {
    display: 'flex',
    gap: TOKENS.spacing[2],
    marginBottom: TOKENS.spacing[6],
    flexWrap: 'wrap' as const,
  },

  filterButton: {
    padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[4]}`,
    backgroundColor: TOKENS.colors.surface,
    border: `${TOKENS.borderWidth[1]} solid ${TOKENS.colors.border}`,
    borderRadius: TOKENS.borderRadius.full,
    fontSize: TOKENS.typography.fontSize.sm,
    fontWeight: TOKENS.typography.fontWeight.semibold,
    color: TOKENS.colors.text.secondary,
    cursor: 'pointer',
    transition: TOKENS.transitions.base,
  },

  filterButtonActive: {
    backgroundColor: TOKENS.colors.primary[600],
    borderColor: TOKENS.colors.primary[600],
    color: TOKENS.colors.text.inverse,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: TOKENS.spacing[6],
  },

  loading: {
    textAlign: 'center' as const,
    padding: TOKENS.spacing[12],
    color: TOKENS.colors.text.secondary,
  },

  empty: {
    textAlign: 'center' as const,
    padding: TOKENS.spacing[12],
  },

  emptyIcon: {
    fontSize: '64px',
    display: 'block',
    marginBottom: TOKENS.spacing[4],
    opacity: 0.5,
  },

  emptyText: {
    fontSize: TOKENS.typography.fontSize.base,
    color: TOKENS.colors.text.secondary,
    margin: 0,
  },
};
