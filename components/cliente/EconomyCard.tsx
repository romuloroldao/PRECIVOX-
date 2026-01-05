/**
 * Economy Card - Card de Economia Total
 * 
 * SQUAD A - Frontend/UX
 * 
 * Mostra economia total do usuário em destaque
 */

import React from 'react';
import { TOKENS } from '@/styles/tokens';

interface EconomyCardProps {
  totalSavings: number; // em centavos
  savingsThisMonth: number; // em centavos
  isLoading?: boolean;
}

export function EconomyCard({ 
  totalSavings, 
  savingsThisMonth,
  isLoading = false 
}: EconomyCardProps) {
  const totalInReais = (totalSavings / 100).toFixed(2);
  const monthInReais = (savingsThisMonth / 100).toFixed(2);

  if (isLoading) {
    return (
      <div style={styles.card}>
        <div style={styles.skeleton}>Carregando...</div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.icon}>💰</span>
        <h2 style={styles.title}>Sua Economia</h2>
      </div>

      <div style={styles.mainAmount}>
        <span style={styles.currency}>R$</span>
        <span style={styles.value}>
          {Number(totalInReais).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>

      <p style={styles.subtitle}>Total economizado</p>

      <div style={styles.divider} />

      <div style={styles.monthSection}>
        <span style={styles.monthLabel}>Este mês:</span>
        <span style={styles.monthValue}>
          R$ {Number(monthInReais).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: `linear-gradient(135deg, ${TOKENS.colors.secondary[600]} 0%, ${TOKENS.colors.secondary[800]} 100%)`,
    borderRadius: TOKENS.borderRadius.xl,
    padding: TOKENS.spacing[6],
    color: TOKENS.colors.text.inverse,
    boxShadow: TOKENS.shadows.xl,
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[2],
    marginBottom: TOKENS.spacing[4],
  },

  icon: {
    fontSize: '32px',
  },

  title: {
    fontSize: TOKENS.typography.fontSize.lg,
    fontWeight: TOKENS.typography.fontWeight.semibold,
    margin: 0,
  },

  mainAmount: {
    display: 'flex',
    alignItems: 'baseline',
    gap: TOKENS.spacing[2],
    marginBottom: TOKENS.spacing[2],
  },

  currency: {
    fontSize: TOKENS.typography.fontSize.xl,
    fontWeight: TOKENS.typography.fontWeight.semibold,
    opacity: 0.9,
  },

  value: {
    fontSize: TOKENS.typography.fontSize['5xl'],
    fontWeight: TOKENS.typography.fontWeight.extrabold,
    lineHeight: 1,
  },

  subtitle: {
    fontSize: TOKENS.typography.fontSize.sm,
    opacity: 0.9,
    margin: 0,
    marginBottom: TOKENS.spacing[4],
  },

  divider: {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: TOKENS.spacing[4],
  },

  monthSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  monthLabel: {
    fontSize: TOKENS.typography.fontSize.sm,
    opacity: 0.9,
  },

  monthValue: {
    fontSize: TOKENS.typography.fontSize.lg,
    fontWeight: TOKENS.typography.fontWeight.bold,
  },

  skeleton: {
    padding: TOKENS.spacing[8],
    textAlign: 'center' as const,
    opacity: 0.7,
  },
};
