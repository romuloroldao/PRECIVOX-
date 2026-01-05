/**
 * BadgeProgress Component - Barra de Progresso de Badge
 * 
 * SQUAD A - Frontend/UX
 * 
 * Mostra progresso para desbloquear um badge
 */

import React from 'react';
import { TOKENS } from '@/styles/tokens';
import { Badge, BadgeProps } from './Badge';

interface BadgeProgressProps {
  current: number;
  required: number;
  badge: Omit<BadgeProps, 'unlocked' | 'progress'>;
}

export function BadgeProgress({ current, required, badge }: BadgeProgressProps) {
  const percentage = Math.min(Math.round((current / required) * 100), 100);
  const remaining = Math.max(required - current, 0);

  return (
    <div style={styles.container}>
      {/* Badge Preview */}
      <div style={styles.badgeContainer}>
        <Badge
          {...badge}
          unlocked={false}
          progress={percentage}
          size="md"
        />
      </div>

      {/* Progress Info */}
      <div style={styles.info}>
        <div style={styles.header}>
          <h4 style={styles.name}>{badge.name}</h4>
          <span style={styles.percentage}>{percentage}%</span>
        </div>

        {/* Progress Bar */}
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${percentage}%`,
              backgroundColor:
                percentage >= 75
                  ? TOKENS.colors.success
                  : percentage >= 50
                  ? TOKENS.colors.secondary[500]
                  : TOKENS.colors.warning,
            }}
          />
        </div>

        {/* Values */}
        <div style={styles.values}>
          <span style={styles.current}>
            {current.toLocaleString('pt-BR')} / {required.toLocaleString('pt-BR')}
          </span>
          {remaining > 0 && (
            <span style={styles.remaining}>
              Faltam {remaining.toLocaleString('pt-BR')}
            </span>
          )}
        </div>

        {/* Description */}
        <p style={styles.description}>{badge.description}</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: TOKENS.spacing[4],
    padding: TOKENS.spacing[4],
    backgroundColor: TOKENS.colors.surface,
    borderRadius: TOKENS.borderRadius.lg,
    border: `${TOKENS.borderWidth[1]} solid ${TOKENS.colors.border}`,
  },

  badgeContainer: {
    flexShrink: 0,
  },

  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: TOKENS.spacing[2],
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  name: {
    fontSize: TOKENS.typography.fontSize.lg,
    fontWeight: TOKENS.typography.fontWeight.semibold,
    color: TOKENS.colors.text.primary,
    margin: 0,
  },

  percentage: {
    fontSize: TOKENS.typography.fontSize.sm,
    fontWeight: TOKENS.typography.fontWeight.bold,
    color: TOKENS.colors.primary[600],
  },

  progressBar: {
    height: '8px',
    backgroundColor: TOKENS.colors.gray[200],
    borderRadius: TOKENS.borderRadius.full,
    overflow: 'hidden' as const,
  },

  progressFill: {
    height: '100%',
    transition: 'width 0.5s ease-out, background-color 0.3s ease',
    borderRadius: TOKENS.borderRadius.full,
  },

  values: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: TOKENS.typography.fontSize.sm,
  },

  current: {
    color: TOKENS.colors.text.primary,
    fontWeight: TOKENS.typography.fontWeight.semibold,
  },

  remaining: {
    color: TOKENS.colors.text.secondary,
  },

  description: {
    fontSize: TOKENS.typography.fontSize.sm,
    color: TOKENS.colors.text.secondary,
    margin: 0,
    lineHeight: TOKENS.typography.lineHeight.relaxed,
  },
};
