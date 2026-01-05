/**
 * Badge Component - Badge Individual
 * 
 * SQUAD A - Frontend/UX
 * 
 * Mostra um badge com estados: locked, unlocked, in-progress
 */

import React from 'react';
import { TOKENS } from '@/styles/tokens';

export interface BadgeProps {
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
  points: number;
  size?: 'sm' | 'md' | 'lg';
  progress?: number; // 0-100 (para in-progress)
  onClick?: () => void;
}

export function Badge({
  icon,
  name,
  description,
  unlocked,
  points,
  size = 'md',
  progress,
  onClick,
}: BadgeProps) {
  const isInProgress = progress !== undefined && progress > 0 && progress < 100;
  
  const sizeStyles = {
    sm: { container: 80, icon: '32px', name: TOKENS.typography.fontSize.xs },
    md: { container: 100, icon: '40px', name: TOKENS.typography.fontSize.sm },
    lg: { container: 120, icon: '48px', name: TOKENS.typography.fontSize.base },
  }[size];

  return (
    <div
      style={{
        ...styles.container,
        width: sizeStyles.container,
        opacity: unlocked ? 1 : 0.5,
        filter: unlocked ? 'none' : 'grayscale(100%)',
        cursor: onClick ? 'pointer' : 'default',
        animation: unlocked ? 'badgeUnlock 0.5s ease-out' : 'none',
      }}
      onClick={onClick}
      title={description}
    >
      {/* Badge Circle */}
      <div
        style={{
          ...styles.circle,
          borderColor: isInProgress ? TOKENS.colors.secondary[400] : 
                       unlocked ? TOKENS.colors.primary[500] : TOKENS.colors.gray[300],
          animation: isInProgress ? 'pulse 2s infinite' : 'none',
        }}
      >
        <span style={{ ...styles.icon, fontSize: sizeStyles.icon }}>
          {icon}
        </span>
      </div>

      {/* Badge Name */}
      <p style={{ ...styles.name, fontSize: sizeStyles.name }}>
        {name}
      </p>

      {/* Points */}
      <div style={styles.points}>
        <span style={styles.pointsIcon}>⭐</span>
        <span style={styles.pointsValue}>{points}</span>
      </div>

      {/* Lock Icon (if locked) */}
      {!unlocked && !isInProgress && (
        <div style={styles.lockIcon}>🔒</div>
      )}

      {/* Progress Ring (if in-progress) */}
      {isInProgress && (
        <div style={styles.progressRing}>
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={TOKENS.colors.gray[200]}
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={TOKENS.colors.secondary[500]}
              strokeWidth="4"
              strokeDasharray={`${progress! * 2.83} 283`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: TOKENS.spacing[2],
    position: 'relative' as const,
    transition: TOKENS.transitions.base,
  },

  circle: {
    width: '100%',
    aspectRatio: '1',
    borderRadius: TOKENS.borderRadius.full,
    border: `${TOKENS.borderWidth[3]} solid`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TOKENS.colors.background,
    position: 'relative' as const,
  },

  icon: {
    display: 'block',
  },

  name: {
    fontWeight: TOKENS.typography.fontWeight.semibold,
    color: TOKENS.colors.text.primary,
    textAlign: 'center' as const,
    margin: 0,
    lineHeight: TOKENS.typography.lineHeight.tight,
  },

  points: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[1],
    fontSize: TOKENS.typography.fontSize.xs,
    color: TOKENS.colors.text.secondary,
  },

  pointsIcon: {
    fontSize: '12px',
  },

  pointsValue: {
    fontWeight: TOKENS.typography.fontWeight.semibold,
  },

  lockIcon: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '24px',
    opacity: 0.8,
  },

  progressRing: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as const,
  },
};

// Adicionar keyframes para animações (em um arquivo CSS global ou styled-components)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes badgeUnlock {
      0% { transform: scale(0.8); opacity: 0; }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
  document.head.appendChild(style);
}
