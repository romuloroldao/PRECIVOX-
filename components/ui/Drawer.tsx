'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'bottom' | 'responsive';
  size?: 'sm' | 'md' | 'lg';
  overlayClassName?: string;
  drawerClassName?: string;
  /** Classes do cabeçalho (ex.: fundo colorido) */
  titleBarClassName?: string;
  /** Substitui o wrapper padrão do conteúdo (scroll + padding) */
  innerClassName?: string;
  /** Estilo do botão fechar (ex.: texto branco em header escuro) */
  closeButtonClassName?: string;
  /** id para aria-controls / testes */
  id?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
  overlayClassName,
  drawerClassName,
  titleBarClassName,
  innerClassName,
  closeButtonClassName,
  id,
}: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Responsive: mobile = bottom, desktop = right
  const effectivePosition = position === 'responsive' ? 'right' : position;
  const mobilePosition = position === 'responsive' ? 'bottom' : position;

  const positionsDesktop = {
    left: 'left-0 top-0 h-full',
    right: 'right-0 top-0 h-full',
    bottom: 'bottom-0 left-0 right-0 max-h-[90vh]',
  };

  const positionsMobile = {
    left: 'left-0 top-0 h-full',
    right: 'right-0 top-0 h-full',
    bottom: 'bottom-0 left-0 right-0 max-h-[90vh]',
  };

  const sizesDesktop = {
    sm: effectivePosition === 'bottom' ? 'h-1/2' : 'w-80',
    md: effectivePosition === 'bottom' ? 'h-2/3' : 'w-96',
    lg: effectivePosition === 'bottom' ? 'h-5/6' : 'w-[32rem]',
  };

  const sizesMobile = {
    sm: mobilePosition === 'bottom' ? 'h-1/2' : 'w-full',
    md: mobilePosition === 'bottom' ? 'h-2/3' : 'w-full',
    lg: mobilePosition === 'bottom' ? 'h-5/6' : 'w-full',
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in',
          overlayClassName
        )}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div
        id={id}
        className={cn(
          'fixed z-50 bg-bg-paper shadow-xl',
          'flex h-full max-h-screen flex-col',
          'transition-transform duration-300 ease-in-out',
          // Painel visível quando isOpen (componente só monta aberto)
          mobilePosition === 'left' && 'left-0 top-0 w-full translate-x-0 md:w-96',
          mobilePosition === 'right' && 'right-0 top-0 w-full translate-x-0 md:w-96',
          mobilePosition === 'bottom' &&
            'bottom-0 left-0 right-0 max-h-[90vh] translate-y-0 md:right-0 md:left-auto md:top-0 md:h-full md:max-h-screen md:w-96',
          size === 'sm' && effectivePosition !== 'bottom' && 'md:w-80',
          size === 'lg' && effectivePosition !== 'bottom' && 'md:w-[min(32rem,92vw)]',
          drawerClassName
        )}
      >
        {title && (
          <div
            className={cn(
              'flex shrink-0 items-center justify-between border-b border-gray-200 p-4',
              titleBarClassName
            )}
          >
            {typeof title === 'string' ? (
              <h2 className="text-lg md:text-xl font-bold text-text-primary">{title}</h2>
            ) : (
              <div className="min-w-0 flex-1">{title}</div>
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              onClick={onClose}
              className={cn('ml-2 shrink-0', closeButtonClassName)}
              aria-label="Fechar"
            >
              <span className="sr-only">Fechar</span>
            </Button>
          </div>
        )}
        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto p-4',
            innerClassName
          )}
        >
          {children}
        </div>
      </div>
    </>
  );
}
