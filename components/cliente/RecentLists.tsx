/**
 * Recent Lists - Listas Recentes
 * 
 * SQUAD A - Frontend/UX
 * 
 * Mostra últimas listas criadas pelo usuário
 */

import React from 'react';
import { TOKENS } from '@/styles/tokens';
import Link from 'next/link';

interface List {
  id: string;
  name: string;
  itemsCount: number;
  totalSavings: number; // centavos
  updatedAt: string;
}

interface RecentListsProps {
  lists: List[];
  isLoading?: boolean;
}

export function RecentLists({ lists, isLoading = false }: RecentListsProps) {
  if (isLoading) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Minhas Listas</h3>
        <div style={styles.skeleton}>Carregando...</div>
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Minhas Listas</h3>
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>📝</span>
          <p style={styles.emptyText}>Você ainda não tem listas</p>
          <Link href="/cliente/listas" style={styles.emptyLink}>
            Criar primeira lista
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Minhas Listas</h3>
        <Link href="/cliente/listas" style={styles.viewAll}>
          Ver todas
        </Link>
      </div>

      <div style={styles.listGrid}>
        {lists.map((list) => (
          <ListCard key={list.id} list={list} />
        ))}
      </div>
    </div>
  );
}

function ListCard({ list }: { list: List }) {
  const savingsInReais = (list.totalSavings / 100).toFixed(2);
  const date = new Date(list.updatedAt);
  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  return (
    <Link href={`/cliente/listas/${list.id}`} style={{ textDecoration: 'none' }}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h4 style={styles.cardTitle}>{list.name}</h4>
          <span style={styles.cardDate}>{formattedDate}</span>
        </div>

        <div style={styles.cardStats}>
          <div style={styles.stat}>
            <span style={styles.statIcon}>📦</span>
            <span style={styles.statValue}>{list.itemsCount} itens</span>
          </div>

          <div style={styles.stat}>
            <span style={styles.statIcon}>💰</span>
            <span style={styles.statValue}>
              R$ {Number(savingsInReais).toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

const styles = {
  container: {
    marginTop: TOKENS.spacing[6],
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: TOKENS.spacing[4],
  },

  title: {
    fontSize: TOKENS.typography.fontSize['2xl'],
    fontWeight: TOKENS.typography.fontWeight.bold,
    color: TOKENS.colors.text.primary,
    margin: 0,
  },

  viewAll: {
    fontSize: TOKENS.typography.fontSize.sm,
    color: TOKENS.colors.primary[600],
    textDecoration: 'none',
    fontWeight: TOKENS.typography.fontWeight.semibold,
  },

  listGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: TOKENS.spacing[4],
  },

  card: {
    backgroundColor: TOKENS.colors.background,
    border: `${TOKENS.borderWidth[1]} solid ${TOKENS.colors.border}`,
    borderRadius: TOKENS.borderRadius.lg,
    padding: TOKENS.spacing[4],
    transition: TOKENS.transitions.base,
    cursor: 'pointer',
    ':hover': {
      boxShadow: TOKENS.shadows.md,
      transform: 'translateY(-2px)',
    },
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: TOKENS.spacing[3],
  },

  cardTitle: {
    fontSize: TOKENS.typography.fontSize.lg,
    fontWeight: TOKENS.typography.fontWeight.semibold,
    color: TOKENS.colors.text.primary,
    margin: 0,
  },

  cardDate: {
    fontSize: TOKENS.typography.fontSize.xs,
    color: TOKENS.colors.text.secondary,
  },

  cardStats: {
    display: 'flex',
    gap: TOKENS.spacing[4],
  },

  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[1],
  },

  statIcon: {
    fontSize: '16px',
  },

  statValue: {
    fontSize: TOKENS.typography.fontSize.sm,
    color: TOKENS.colors.text.secondary,
  },

  empty: {
    textAlign: 'center' as const,
    padding: TOKENS.spacing[8],
    backgroundColor: TOKENS.colors.surface,
    borderRadius: TOKENS.borderRadius.lg,
  },

  emptyIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: TOKENS.spacing[3],
  },

  emptyText: {
    fontSize: TOKENS.typography.fontSize.base,
    color: TOKENS.colors.text.secondary,
    marginBottom: TOKENS.spacing[4],
  },

  emptyLink: {
    display: 'inline-block',
    padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[4]}`,
    backgroundColor: TOKENS.colors.primary[600],
    color: TOKENS.colors.text.inverse,
    borderRadius: TOKENS.borderRadius.md,
    textDecoration: 'none',
    fontSize: TOKENS.typography.fontSize.sm,
    fontWeight: TOKENS.typography.fontWeight.semibold,
  },

  skeleton: {
    padding: TOKENS.spacing[8],
    textAlign: 'center' as const,
    backgroundColor: TOKENS.colors.surface,
    borderRadius: TOKENS.borderRadius.lg,
    color: TOKENS.colors.text.secondary,
  },
};
