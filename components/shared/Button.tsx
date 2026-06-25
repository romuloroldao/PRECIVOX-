/**
 * @deprecated Use `@/components/ui/Button` em vez deste.
 * Este arquivo existe apenas para manter compatibilidade durante a migração.
 */

'use client';

import React from 'react';
import { Button as UIButton } from '@/components/ui/Button';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const VARIANT_MAP: Record<string, 'primary' | 'secondary' | 'outline' | 'ghost' | 'error'> = {
  primary: 'primary',
  secondary: 'secondary',
  outline: 'outline',
  ghost: 'ghost',
  danger: 'error',
};

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
  return (
    <UIButton
      variant={VARIANT_MAP[variant] || 'primary'}
      size={size}
      onClick={onClick}
      disabled={disabled}
      isLoading={loading}
      type={type}
      className={`${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {leftIcon && <span>{leftIcon}</span>}
      {children}
      {rightIcon && <span>{rightIcon}</span>}
    </UIButton>
  );
}
