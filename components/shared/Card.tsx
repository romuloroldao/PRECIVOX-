/**
 * @deprecated Use `@/components/ui/Card` em vez deste.
 * Este arquivo existe apenas para manter compatibilidade durante a migração.
 */

'use client';

import React from 'react';
import { Card as UICard } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface CardProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  hoverable?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const PADDING_MAP: Record<string, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const SHADOW_MAP: Record<string, string> = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
};

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
  return (
    <UICard
      variant={border ? 'default' : 'elevated'}
      hover={hoverable}
      className={cn(PADDING_MAP[padding], SHADOW_MAP[shadow], className)}
      onClick={onClick}
      style={style}
    >
      {children}
    </UICard>
  );
}
