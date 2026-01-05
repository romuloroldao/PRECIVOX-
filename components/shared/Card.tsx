/**
 * Card Component - Container Base
 * 
 * Uso:
 * <Card padding="md" shadow="md">
 *   <h2>Título</h2>
 *   <p>Conteúdo</p>
 * </Card>
 * 
 * @squad-a @squad-b
 */

import React from 'react';
import { TOKENS } from '@/styles/tokens';

export interface CardProps {
  /** Conteúdo do card */
  children: React.ReactNode;
  
  /** Padding interno */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  
  /** Sombra */
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  
  /** Borda */
  border?: boolean;
  
  /** Hover effect */
  hoverable?: boolean;
  
  /** Callback ao clicar */
  onClick?: () => void;
  
  /** Classes CSS adicionais */
  className?: string;
  
  /** Estilos inline adicionais */
  style?: React.CSSProperties;
}

export function Card({
  children,
  padding = 'md',
  shadow = 'md',
  border = true,
  hoverable = false,
  onClick,
  className = '',
  style = {},
}: CardProps) {
  const paddingMap = {
    none: '0',
    sm: TOKENS.spacing[3],
    md: TOKENS.spacing[4],
    lg: TOKENS.spacing[6],
  };

  const shadowMap = {
    none: 'none',
    sm: TOKENS.shadows.sm,
    md: TOKENS.shadows.md,
    lg: TOKENS.shadows.lg,
  };

  const baseStyles = {
    backgroundColor: TOKENS.colors.background,
    borderRadius: TOKENS.borderRadius.lg,
    padding: paddingMap[padding],
    boxShadow: shadowMap[shadow],
    border: border ? `${TOKENS.borderWidth[1]} solid ${TOKENS.colors.border}` : 'none',
    transition: TOKENS.transitions.base,
    cursor: onClick ? 'pointer' : 'default',
  };

  const hoverStyles = hoverable ? {
    ':hover': {
      boxShadow: TOKENS.shadows.lg,
      transform: 'translateY(-2px)',
    },
  } : {};

  return (
    <div
      onClick={onClick}
      className={className}
      style={{ ...baseStyles, ...style }}
    >
      {children}
    </div>
  );
}
