/**
 * Button Component - Componente Base
 * 
 * Uso:
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Clique Aqui
 * </Button>
 * 
 * @squad-a @squad-b
 */

import React from 'react';
import { TOKENS } from '@/styles/tokens';

export interface ButtonProps {
  /** Variante visual do botão */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  
  /** Tamanho do botão */
  size?: 'sm' | 'md' | 'lg';
  
  /** Conteúdo do botão */
  children: React.ReactNode;
  
  /** Callback ao clicar */
  onClick?: () => void;
  
  /** Botão desabilitado */
  disabled?: boolean;
  
  /** Estado de carregamento */
  loading?: boolean;
  
  /** Largura total */
  fullWidth?: boolean;
  
  /** Tipo do botão HTML */
  type?: 'button' | 'submit' | 'reset';
  
  /** Classes CSS adicionais */
  className?: string;
  
  /** Ícone à esquerda */
  leftIcon?: React.ReactNode;
  
  /** Ícone à direita */
  rightIcon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
  className = '',
  leftIcon,
  rightIcon,
}: ButtonProps) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: TOKENS.spacing[2],
    fontFamily: TOKENS.typography.fontFamily.sans,
    fontWeight: TOKENS.typography.fontWeight.semibold,
    borderRadius: TOKENS.borderRadius.lg,
    transition: TOKENS.transitions.base,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    border: 'none',
    outline: 'none',
  };

  const variantStyles = {
    primary: {
      backgroundColor: TOKENS.colors.primary[600],
      color: TOKENS.colors.text.inverse,
      boxShadow: TOKENS.shadows.sm,
    },
    secondary: {
      backgroundColor: TOKENS.colors.secondary[600],
      color: TOKENS.colors.text.inverse,
      boxShadow: TOKENS.shadows.sm,
    },
    outline: {
      backgroundColor: 'transparent',
      color: TOKENS.colors.primary[600],
      border: `${TOKENS.borderWidth[2]} solid ${TOKENS.colors.primary[600]}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: TOKENS.colors.text.primary,
    },
    danger: {
      backgroundColor: TOKENS.colors.error,
      color: TOKENS.colors.text.inverse,
      boxShadow: TOKENS.shadows.sm,
    },
  };

  const sizeStyles = {
    sm: {
      padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
      fontSize: TOKENS.typography.fontSize.sm,
      minHeight: '32px',
    },
    md: {
      padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
      fontSize: TOKENS.typography.fontSize.base,
      minHeight: '40px',
    },
    lg: {
      padding: `${TOKENS.spacing[4]} ${TOKENS.spacing[6]}`,
      fontSize: TOKENS.typography.fontSize.lg,
      minHeight: '48px',
    },
  };

  const combinedStyles = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      style={combinedStyles}
    >
      {loading ? (
        <Spinner size={size} />
      ) : (
        <>
          {leftIcon && <span>{leftIcon}</span>}
          {children}
          {rightIcon && <span>{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

// Componente auxiliar de Spinner
function Spinner({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: '16px',
    md: '20px',
    lg: '24px',
  };

  return (
    <svg
      width={sizeMap[size]}
      height={sizeMap[size]}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
