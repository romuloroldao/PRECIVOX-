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
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
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
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div
        className={cn(
          'fixed z-50 bg-bg-paper shadow-xl',
          'flex flex-col',
          'transition-transform duration-300 ease-in-out',
          // Mobile positioning and size
          mobilePosition === 'left' && 'left-0 top-0 h-full w-full md:w-96',
          mobilePosition === 'right' && 'right-0 top-0 h-full w-full md:w-96',
          mobilePosition === 'bottom' && 'bottom-0 left-0 right-0 h-2/3 md:h-full md:right-0 md:left-auto md:w-96',
          // Mobile animations
          mobilePosition === 'left' && '-translate-x-full md:translate-x-0',
          mobilePosition === 'right' && 'translate-x-full md:translate-x-0',
          mobilePosition === 'bottom' && 'translate-y-full md:translate-y-0',
          // Desktop size overrides
          size === 'sm' && effectivePosition !== 'bottom' && 'md:w-80',
          size === 'lg' && effectivePosition !== 'bottom' && 'md:w-[32rem]',
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {typeof title === 'string' ? (
              <h2 className="text-lg md:text-xl font-bold text-text-primary">{title}</h2>
            ) : (
              <div className="flex-1">{title}</div>
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              onClick={onClose}
              className="ml-2"
              aria-label="Fechar"
            >
              <span className="sr-only">Fechar</span>
            </Button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </>
  );
}
