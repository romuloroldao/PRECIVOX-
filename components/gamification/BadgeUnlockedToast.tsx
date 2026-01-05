/**
 * BadgeUnlockedToast Component - Notificação de Badge Desbloqueado
 * 
 * SQUAD A - Frontend/UX
 * 
 * Toast que aparece quando um badge é desbloqueado
 */

'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { TOKENS } from '@/styles/tokens';
import { BadgeProps } from './Badge';

interface BadgeUnlockedToastProps {
  badge: Omit<BadgeProps, 'unlocked' | 'size'>;
  onClose: () => void;
  autoClose?: number; // ms
}

export function BadgeUnlockedToast({
  badge,
  onClose,
  autoClose = 5000,
}: BadgeUnlockedToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-close
    if (autoClose > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation
  };

  if (!isMounted) return null;

  const toast = (
    <div
      style={{
        ...styles.overlay,
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div
        style={{
          ...styles.toast,
          transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Close Button */}
        <button onClick={handleClose} style={styles.closeButton}>
          ✕
        </button>

        {/* Content */}
        <div style={styles.content}>
          {/* Icon */}
          <div style={styles.iconContainer}>
            <span style={styles.icon}>{badge.icon}</span>
            <div style={styles.sparkles}>✨</div>
          </div>

          {/* Text */}
          <div style={styles.textContainer}>
            <p style={styles.title}>🎉 Badge Desbloqueado!</p>
            <h3 style={styles.badgeName}>{badge.name}</h3>
            <p style={styles.description}>{badge.description}</p>
            <div style={styles.points}>
              <span style={styles.pointsIcon}>⭐</span>
              <span style={styles.pointsText}>+{badge.points} pontos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(toast, document.body);
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    right: 0,
    zIndex: TOKENS.zIndex.modal,
    pointerEvents: 'none' as const,
    transition: 'opacity 0.3s ease',
  },

  toast: {
    position: 'fixed' as const,
    top: TOKENS.spacing[4],
    right: TOKENS.spacing[4],
    maxWidth: '400px',
    width: 'calc(100vw - 32px)',
    backgroundColor: TOKENS.colors.background,
    borderRadius: TOKENS.borderRadius.xl,
    boxShadow: TOKENS.shadows['2xl'],
    border: `${TOKENS.borderWidth[2]} solid ${TOKENS.colors.primary[500]}`,
    padding: TOKENS.spacing[4],
    pointerEvents: 'auto' as const,
    transition: 'transform 0.3s ease-out',
  },

  closeButton: {
    position: 'absolute' as const,
    top: TOKENS.spacing[2],
    right: TOKENS.spacing[2],
    background: 'none',
    border: 'none',
    fontSize: TOKENS.typography.fontSize.lg,
    color: TOKENS.colors.text.secondary,
    cursor: 'pointer',
    padding: TOKENS.spacing[1],
    lineHeight: 1,
  },

  content: {
    display: 'flex',
    gap: TOKENS.spacing[4],
    alignItems: 'flex-start',
  },

  iconContainer: {
    position: 'relative' as const,
    flexShrink: 0,
  },

  icon: {
    fontSize: '64px',
    display: 'block',
    animation: 'bounce 0.6s ease-out',
  },

  sparkles: {
    position: 'absolute' as const,
    top: -8,
    right: -8,
    fontSize: '24px',
    animation: 'sparkle 1s ease-out infinite',
  },

  textContainer: {
    flex: 1,
  },

  title: {
    fontSize: TOKENS.typography.fontSize.sm,
    fontWeight: TOKENS.typography.fontWeight.semibold,
    color: TOKENS.colors.primary[600],
    margin: `0 0 ${TOKENS.spacing[1]} 0`,
  },

  badgeName: {
    fontSize: TOKENS.typography.fontSize.xl,
    fontWeight: TOKENS.typography.fontWeight.bold,
    color: TOKENS.colors.text.primary,
    margin: `0 0 ${TOKENS.spacing[2]} 0`,
  },

  description: {
    fontSize: TOKENS.typography.fontSize.sm,
    color: TOKENS.colors.text.secondary,
    margin: `0 0 ${TOKENS.spacing[3]} 0`,
    lineHeight: TOKENS.typography.lineHeight.relaxed,
  },

  points: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[1],
    padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[2]}`,
    backgroundColor: TOKENS.colors.secondary[100],
    borderRadius: TOKENS.borderRadius.full,
    width: 'fit-content',
  },

  pointsIcon: {
    fontSize: '16px',
  },

  pointsText: {
    fontSize: TOKENS.typography.fontSize.sm,
    fontWeight: TOKENS.typography.fontWeight.bold,
    color: TOKENS.colors.secondary[700],
  },
};

// Add animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      25% { transform: translateY(-10px); }
      50% { transform: translateY(0); }
      75% { transform: translateY(-5px); }
    }
    
    @keyframes sparkle {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
    }
  `;
  document.head.appendChild(style);
}
