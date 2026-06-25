'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  /** Altura máxima — ex: '85vh' */
  maxHeight?: string;
  className?: string;
  innerClassName?: string;
  id?: string;
  /** Sem padding no conteúdo interno */
  innerNoPadding?: boolean;
}

/**
 * Bottom sheet mobile-first com handle de arraste visual.
 * Em desktop (md+) renderiza como painel centralizado tipo modal.
 */
export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = '90vh',
  className,
  innerClassName,
  id,
  innerNoPadding = false,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

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
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        id={id}
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? `${id ?? 'sheet'}-title` : undefined}
        className={cn(
          'fixed z-50 flex flex-col overflow-hidden bg-bg-paper shadow-xl',
          'bottom-0 left-0 right-0 rounded-t-2xl',
          'md:bottom-auto md:left-1/2 md:top-1/2 md:right-auto md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl',
          'animate-in slide-in-from-bottom duration-300 md:fade-in md:zoom-in-95',
          className
        )}
        style={{ maxHeight }}
      >
        {/* Handle — mobile only */}
        <div className="flex shrink-0 justify-center pt-3 pb-1 md:hidden" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-slate-300" />
        </div>

        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
            {typeof title === 'string' ? (
              <h2
                id={`${id ?? 'sheet'}-title`}
                className="text-lg font-bold text-text-primary"
              >
                {title}
              </h2>
            ) : (
              <div className="min-w-0 flex-1" id={`${id ?? 'sheet'}-title`}>
                {title}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              onClick={onClose}
              className="ml-2 shrink-0"
              aria-label="Fechar"
            >
              <span className="sr-only">Fechar</span>
            </Button>
          </div>
        )}

        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overscroll-contain',
            !innerNoPadding && 'p-4',
            innerClassName
          )}
        >
          {children}
        </div>
      </div>
    </>
  );
}
